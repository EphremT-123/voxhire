const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { type: String, default: 'internal' },
}, { timestamps: true });

module.exports = mongoose.model('Share', shareSchema);