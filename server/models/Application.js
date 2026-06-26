const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artistName: { type: String, required: true },
    coverLetter: { type: String, default: '' },
    portfolioUrl: { type: String, default: null },
    portfolioFile: { type: String, default: null },
    status: { type: String, enum: ['pending', 'shortlisted', 'accepted', 'declined'], default: 'pending' },
    connectsSpent: { type: Number, default: 10 },
    refunded: { type: Boolean, default: false },
    isInvitation: { type: Boolean, default: false },       // NEW
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // NEW
}, { timestamps: true });

applicationSchema.index({ job: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);