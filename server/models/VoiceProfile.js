const mongoose = require('mongoose');

const voiceProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    language: { type: String, required: true },
    accent: { type: String, required: true },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    selfVoiceStyle: [String],
    aiVoiceStyle: [String],
    demoUrl: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('VoiceProfile', voiceProfileSchema);