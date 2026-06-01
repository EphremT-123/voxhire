const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: { type: String, required: true },
    budget: { type: Number, required: true },
    deadline: { type: String, required: true },
    description: { type: String, required: true },
    urgency: { type: String, enum: ['normal', 'urgent', 'super_urgent'], default: 'normal' },
    connectCost: { type: Number, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
    hiredArtist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);