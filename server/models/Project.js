const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    script: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
    },
    accent: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'any'],
        default: 'any',
    },
    budget: {
        type: Number,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'completed', 'disputed', 'cancelled'],
        default: 'open',
    },
    selectedBid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        default: null,
    },
    delivery: {
        originalUrl: String,
        watermarkedUrl: String,
        status: { type: String, enum: ['none', 'delivered', 'approved', 'disputed'], default: 'none' },
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'escrow_funded', 'delivered', 'completed', 'disputed', 'cancelled'],
        default: 'open',
    },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);