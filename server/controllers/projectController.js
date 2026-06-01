const Project = require('../models/Project');
const Bid = require('../models/Bid');

// @desc    Client creates a new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
    try {
        const { title, script, language, accent, gender, budget, deadline } = req.body;

        const project = await Project.create({
            client: req.user._id,
            title,
            script,
            language,
            accent,
            gender,
            budget,
            deadline,
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all open projects (for artists to browse)
// @route   GET /api/projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ status: 'open' })
            .populate('client', 'name email')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'name email')
            .populate({
                path: 'selectedBid',
                populate: { path: 'artist', select: 'name email' },
            });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Artist places a bid on a project
// @route   POST /api/projects/:id/bid
exports.placeBid = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (project.status !== 'open') {
            return res.status(400).json({ message: 'Project is not open for bidding' });
        }

        const { amount, message, demoUrl } = req.body;

        const bid = await Bid.create({
            project: project._id,
            artist: req.user._id,
            amount,
            message: message || '',
            demoUrl: demoUrl || null,
        });

        res.status(201).json(bid);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already bid on this project' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Client accepts a bid (selects winner)
// @route   PUT /api/projects/:projectId/accept-bid/:bidId
exports.acceptBid = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the project owner can accept a bid' });
        }

        const bid = await Bid.findById(req.params.bidId);
        if (!bid || bid.project.toString() !== project._id.toString()) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Update project
        project.status = 'in_progress';
        project.selectedBid = bid._id;
        await project.save();

        // Update bid status
        bid.status = 'accepted';
        await bid.save();

        // Optionally reject other bids (we can skip for now)

        res.json({ project, bid });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all bids for a project (public for that project)
// @route   GET /api/projects/:id/bids
exports.getBids = async (req, res) => {
    try {
        const bids = await Bid.find({ project: req.params.id })
            .populate('artist', 'name email')
            .sort({ amount: 1 });
        res.json(bids);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};