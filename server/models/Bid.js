const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    message: {
        type: String,
        default: '',
    },
    demoUrl: {
        type: String,
        default: null,   // optional custom demo for the bid
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });

// One artist can only bid once per project
bidSchema.index({ project: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);