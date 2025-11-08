import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String
  },
  mimeType: {
    type: String
  },
  size: {
    type: Number
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  path: {
    type: String, // 🟢 Stores local path to image on disk
    required: true
  },
  originalImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image' // 🟢 Self-reference for tracking transformed versions
  },
}, { timestamps: true });

export const Image = mongoose.model('Image', imageSchema);