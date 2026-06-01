const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['connect_purchase', 'job_application', 'job_posting', 'refund', 'earning', 'fee'], required: true },
    amount: { type: Number, required: true },
    connects: { type: Number, default: 0 },
    description: { type: String, default: '' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);