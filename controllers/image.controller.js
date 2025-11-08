import { Image } from "../models/image.model.js";
import sharp from "sharp";

export const uploadImage = async (req, res) => {
    try {
        const file = req.file;
        if (!file) { return res.status(400).json({ message: "No file uploaded" }) };

        const meta = await sharp(file.path).metadata();

        const image = await Image.create({
            owner: req.userId,
            filename: file.name,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            width: meta.width,
            height: meta.height
        })

        res.status(201).json({ message: "Uploaded successfully", image });
    } catch (err) {
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