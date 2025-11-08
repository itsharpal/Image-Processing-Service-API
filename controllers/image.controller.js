import { Image } from "../models/image.model.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const uploadImage = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: "No file uploaded" });

        const meta = await sharp(file.path).metadata();

        const image = await Image.create({
            owner: req.userId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            width: meta.width,
            height: meta.height,
            path: file.path, // 🟢 Store file path for later transformations
        });

        res.status(201).json({
            success: true,
            message: "Uploaded successfully",
            image,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload failed" });
    }
};

export const getImage = async (req, res) => {
    try {
        const userId = req.userId;
        const images = await Image.find({ owner: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: images.length,
            images,
        });
    } catch (error) {
        console.error("Error fetching images:", error);
        res.status(500).json({ message: "Server error" });
    }
};


export const transformImage = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { transformations } = req.body;

        // 1️⃣ Find the image
        const image = await Image.findOne({ _id: id, owner: userId });
        if (!image) {
            return res.status(404).json({ message: "Image not found" });
        }

        const inputPath = path.resolve(image.path);
        const outputFilename = `transformed-${Date.now()}-${image.filename}`;
        const outputPath = path.resolve(`uploads/${outputFilename}`);

        // 2️⃣ Initialize sharp
        let sharpInstance = sharp(inputPath);

        // 3️⃣ Apply transformations dynamically
        if (transformations.resize) {
            const { width, height } = transformations.resize;
            sharpInstance = sharpInstance.resize(width, height);
        }

        if (transformations.crop) {
            const { width, height, left, top } = transformations.crop;
            sharpInstance = sharpInstance.extract({ width, height, left, top });
        }

        if (transformations.rotate) {
            sharpInstance = sharpInstance.rotate(Number(transformations.rotate));
        }

        if (transformations.flip) sharpInstance = sharpInstance.flip();
        if (transformations.mirror) sharpInstance = sharpInstance.flop();
        if (transformations.grayscale) sharpInstance = sharpInstance.grayscale();

        // 🟤 Simulate Sepia (using color transforms)
        if (transformations.sepia) {
            sharpInstance = sharpInstance.modulate({
                saturation: 0.3,
                brightness: 1.05,
                hue: 30,
            });
        }

        // 💧 Compression
        if (transformations.compress) {
            const quality = transformations.compress.quality || 80;
            sharpInstance = sharpInstance.jpeg({ quality }).png({ quality });
        }

        // 🎨 Format Conversion
        if (transformations.format) {
            const format = transformations.format.toLowerCase();
            if (["jpeg", "jpg", "png", "webp", "tiff"].includes(format)) {
                sharpInstance = sharpInstance.toFormat(format);
            }
        }

        // 🖋 Watermark (Text)
        if (transformations.watermarkText) {
            const svgText = `
        <svg width="500" height="100">
          <text x="10" y="50" font-size="30" fill="white" opacity="0.5">
            ${transformations.watermarkText}
          </text>
        </svg>
      `;
            const buffer = Buffer.from(svgText);
            sharpInstance = sharpInstance.composite([{ input: buffer, gravity: "southeast" }]);
        }

        // 🖼️ Watermark (Logo)
        if (transformations.watermarkLogoPath) {
            const logoPath = path.resolve(transformations.watermarkLogoPath);
            sharpInstance = sharpInstance.composite([{ input: logoPath, gravity: "southeast" }]);
        }


        // 4️⃣ Save transformed image
        await sharpInstance.toFile(outputPath);

        // 5️⃣ Save metadata in DB
        const meta = await sharp(outputPath).metadata();

        const transformedImage = await Image.create({
            owner: userId,
            filename: outputFilename,
            path: outputPath,
            mimeType: meta.format,
            size: fs.statSync(outputPath).size,
            width: meta.width,
            height: meta.height,
            originalImage: image._id,
        });

        // 6️⃣ Respond
        res.status(200).json({
            success: true,
            message: "Image transformed successfully",
            transformedImage,
        });

    } catch (error) {
        console.error("Transformation error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};