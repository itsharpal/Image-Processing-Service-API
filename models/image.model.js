import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    filename: {
        type: String
    },
    originalName: {
        type: String
    },
    mimeType: {
        type: String
    },
    width: {
        type: Number
    },
    height: {
        type: Number
    },
    size: {
        type: Number
    }
}, {timestamps: true});

export const Image = mongoose.model('Image', imageSchema);