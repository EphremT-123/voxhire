const watermarkService = require('../services/watermarkService');
const User = require('../models/User');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const Bid = require('../models/Bid');

// Helper: record a transaction
const createTransaction = async (fromId, toId, projectId, amount, type) => {
    return await Transaction.create({
        from: fromId,
        to: toId,
        project: projectId,
        amount,
        type,
    });
};

// @desc    Client funds a project (moves money from client balance to escrow)
// @route   POST /api/projects/:id/fund
exports.fundProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('selectedBid');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project client can fund' });
        }
        // Require an accepted bid
        if (!project.selectedBid) {
            return res.status(400).json({ message: 'No accepted bid yet' });
        }
        const amount = project.selectedBid.amount;

        const client = await User.findById(req.user._id);
        if (client.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct from client
        client.balance -= amount;
        await client.save();

        // Record escrow hold
        await createTransaction(client._id, project.selectedBid.artist, project._id, amount, 'escrow_hold');

        // Mark project as escrow_funded
        project.status = 'escrow_funded';
        await project.save();

        res.json({ message: 'Project funded', newBalance: client.balance, project });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Artist uploads final deliverable – creates watermarked preview + stores original
// @route   POST /api/projects/:id/deliver
// (We'll add watermarking logic after this controller)
exports.deliverWork = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.status !== 'escrow_funded' && project.status !== 'in_progress') {
            return res.status(400).json({ message: 'Project must be funded before delivery' });
        }
        // Only the assigned artist can deliver
        const bid = await Bid.findById(project.selectedBid);
        if (!bid || bid.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the assigned artist can deliver' });
        }
        if (!req.file) return res.status(400).json({ message: 'No audio file uploaded' });

        // --- Watermarking logic will go here (we'll write next) ---
        // For now, simulate: store the original URL, and create a watermarked preview URL
        // We'll implement real watermarking in the next step.
        // Upload original to Cloudinary
        const cloudinary = require('cloudinary').v2;
        const originalResult = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            { resource_type: 'auto', folder: 'voxhire_deliveries' }
        );

        // Generate watermarked version
        const watermarkedBuffer = await watermarkService.watermarkAudioFile(req.file.buffer, req.file.mimetype);
        const watermarkedResult = await cloudinary.uploader.upload(
            `data:audio/wav;base64,${watermarkedBuffer.toString('base64')}`,
            { resource_type: 'auto', folder: 'voxhire_deliveries' }
        );

        project.delivery = {
            originalUrl: originalResult.secure_url,
            watermarkedUrl: watermarkedResult.secure_url,
            status: 'delivered',
        };
        project.status = 'delivered';
        await project.save();

        res.json({ message: 'Deliverable uploaded', project });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// @desc    Client approves the delivered work (releases funds to artist)
// @route   PUT /api/projects/:id/approve
exports.approveWork = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('selectedBid');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the client can approve' });
        }
        if (project.status !== 'delivered') {
            return res.status(400).json({ message: 'No deliverable to approve' });
        }

        const amount = project.selectedBid.amount;
        const artist = await User.findById(project.selectedBid.artist);
        artist.balance += amount;
        await artist.save();

        await createTransaction(null, artist._id, project._id, amount, 'escrow_release');

        project.status = 'completed';
        project.delivery.status = 'approved';
        await project.save();

        res.json({ message: 'Work approved, funds released', project });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Client disputes the delivery
// @route   PUT /api/projects/:id/dispute
exports.disputeWork = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the client can dispute' });
        }
        if (project.status !== 'delivered') {
            return res.status(400).json({ message: 'No deliverable to dispute' });
        }

        project.status = 'disputed';
        project.delivery.status = 'disputed';
        await project.save();

        res.json({ message: 'Dispute raised', project });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};