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