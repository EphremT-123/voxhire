const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('cloudinary').v2;

const calculateConnectCost = (budget, urgency) => {
    let base = Math.max(50, Math.min(500, Math.floor(budget / 5)));
    if (urgency === 'urgent') base = Math.min(500, Math.floor(base * 1.5));
    if (urgency === 'super_urgent') base = Math.min(500, Math.floor(base * 2));
    return base;
};

// GET /api/jobs - Get all open jobs (artists) or client's own jobs
router.get('/', protect, async (req, res) => {
    try {
        if (req.user.role === 'client') {
            // Clients see only their own jobs
            const jobs = await Job.find({ client: req.user._id })
                .populate('client', 'name username email profilePicture')
                .sort({ createdAt: -1 });
            return res.json(jobs);
        }
        // Artists see all open jobs
        const jobs = await Job.find({ status: 'open' })
            .populate('client', 'name username email profilePicture')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/jobs/my/applications - Artist's own applications
router.get('/my/applications', protect, authorize('artist'), async (req, res) => {
    try {
        const applications = await Application.find({ artist: req.user._id })
            .populate('job', 'title budget deadline clientName status urgency')
            .sort({ createdAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/jobs/client/my-jobs
router.get('/client/my-jobs', protect, authorize('client'), async (req, res) => {
    try {
        const jobs = await Job.find({ client: req.user._id })
            .populate('hiredArtist', 'name username email profilePicture')
            .sort({ createdAt: -1 });
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const appCount = await Application.countDocuments({ job: job._id });
            return { ...job.toObject(), applicationCount: appCount };
        }));
        res.json(jobsWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/jobs - Post a job (client only)
router.post('/', protect, authorize('client'), async (req, res) => {
    try {
        const { title, budget, deadline, description, urgency } = req.body;
        if (!title || !budget || !description) {
            return res.status(400).json({ message: 'Please provide title, budget and description' });
        }
        const connectCost = calculateConnectCost(Number(budget), urgency || 'normal');
        const user = await User.findById(req.user._id);
        if (user.connects < connectCost) {
            return res.status(400).json({ message: `Insufficient connects. You need ${connectCost} connects.` });
        }
        user.connects -= connectCost;
        await user.save();
        await Transaction.create({
            user: req.user._id, type: 'job_posting', connects: connectCost,
            description: `Posted job: ${title}`, amount: connectCost * 0.01,
        });
        const job = await Job.create({
            title, client: req.user._id, clientName: user.name,
            budget: Number(budget), deadline: deadline || '7 days', description,
            urgency: urgency || 'normal', connectCost,
        });
        res.status(201).json({ job, remainingConnects: user.connects });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/jobs/:id/apply – regular apply OR free invitation apply
router.post('/:id/apply', protect, authorize('artist'), upload.single('portfolio'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.status !== 'open') return res.status(400).json({ message: 'Job is not open' });

        const user = await User.findById(req.user._id);

        // Check if the artist has been invited (already an application with isInvitation: true)
        const existingInvitation = await Application.findOne({
            job: job._id,
            artist: req.user._id,
            isInvitation: true
        });

        if (existingInvitation) {
            // Update the invitation with cover letter and portfolio (no connect cost)
            existingInvitation.coverLetter = req.body.coverLetter || '';
            existingInvitation.portfolioUrl = req.body.portfolioUrl || existingInvitation.portfolioUrl;

            if (req.file) {
                const result = await cloudinary.uploader.upload(
                    `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                    { resource_type: 'auto', folder: 'voxhire_portfolios' }
                );
                existingInvitation.portfolioFile = result.secure_url;
            }

            existingInvitation.status = 'pending'; // reset to pending (in case it was something else)
            await existingInvitation.save();

            return res.json({ message: 'Application submitted (free invitation)', application: existingInvitation });
        }

        // Regular application – artist must have enough connects
        if (user.connects < 10) {
            return res.status(400).json({ message: 'Insufficient connects (need 10)' });
        }

        // Deduct connects
        user.connects -= 10;
        await user.save();

        // Upload portfolio file if provided
        let portfolioFile = null;
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                { resource_type: 'auto', folder: 'voxhire_portfolios' }
            );
            portfolioFile = result.secure_url;
        }

        const application = await Application.create({
            job: job._id,
            artist: req.user._id,
            artistName: user.name,
            coverLetter: req.body.coverLetter || '',
            portfolioUrl: req.body.portfolioUrl || null,
            portfolioFile,
            connectsSpent: 10,
        });

        await Transaction.create({
            user: req.user._id,
            type: 'job_application',
            connects: 10,
            description: `Applied to: ${job.title}`,
            job: job._id,
            amount: 0.10,
        });

        res.status(201).json({ application, remainingConnects: user.connects });
    } catch (error) {
        console.error('Apply error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/jobs/:id/invite – client invites an artist (new route)
router.post('/:id/invite', protect, authorize('client'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the job owner can invite' });
        }

        const { artistId } = req.body;
        if (!artistId) return res.status(400).json({ message: 'artistId is required' });

        const artist = await User.findById(artistId);
        if (!artist || artist.role !== 'artist') return res.status(400).json({ message: 'Invalid artist' });

        // Prevent duplicate invitations or applications
        const existingApp = await Application.findOne({ job: job._id, artist: artistId });
        if (existingApp) return res.status(400).json({ message: 'Artist already applied or invited' });

        // Create invitation application (no connect cost, isInvitation: true)
        const application = await Application.create({
            job: job._id,
            artist: artistId,
            artistName: artist.name,
            coverLetter: '',
            status: 'pending',
            connectsSpent: 0,
            isInvitation: true,
            invitedBy: req.user._id,
        });

        // (Optional) You could emit a socket event to the artist, but for now they'll see the job and apply for free.

        res.status(201).json({ message: 'Artist invited', application });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/jobs/:id/applications
router.get('/:id/applications', protect, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        const applications = await Application.find({ job: req.params.id })
            .populate('artist', 'name username email profilePicture bio rating experience languages equipment')
            .sort({ createdAt: -1 });
        res.json({ job, applications });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/jobs/:jobId/shortlist/:appId
router.put('/:jobId/shortlist/:appId', protect, authorize('client'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.client.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
        const app = await Application.findById(req.params.appId);
        if (!app) return res.status(404).json({ message: 'Application not found' });
        app.status = 'shortlisted';
        await app.save();
        res.json({ message: 'Applicant shortlisted', application: app });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/jobs/:jobId/hire/:appId
router.put('/:jobId/hire/:appId', protect, authorize('client'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.client.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
        const app = await Application.findById(req.params.appId);
        if (!app) return res.status(404).json({ message: 'Application not found' });

        app.status = 'accepted';
        await app.save();

        job.status = 'in_progress';
        job.hiredArtist = app.artist;
        await job.save();

        // Decline others & refund
        const otherApps = await Application.find({
            job: job._id,
            _id: { $ne: app._id },
            status: { $in: ['pending', 'shortlisted'] }
        });
        for (const otherApp of otherApps) {
            otherApp.status = 'declined';
            otherApp.refunded = true;
            await otherApp.save();
            // Refund only if connectsSpent > 0
            if (otherApp.connectsSpent > 0) {
                await User.findByIdAndUpdate(otherApp.artist, { $inc: { connects: otherApp.connectsSpent } });
                await Transaction.create({
                    user: otherApp.artist,
                    type: 'refund',
                    connects: otherApp.connectsSpent,
                    description: `Refund for: ${job.title}`,
                    job: job._id,
                    amount: otherApp.connectsSpent * 0.01,
                });
            }
        }

        res.json({ message: 'Artist hired!', job });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PUT /api/jobs/applications/:id/decline
router.put('/applications/:id/decline', protect, authorize('client'), async (req, res) => {
    try {
        const app = await Application.findById(req.params.id);
        if (!app) return res.status(404).json({ message: 'Application not found' });
        if (app.status === 'accepted') return res.status(400).json({ message: 'Already hired' });

        app.status = 'declined';
        app.refunded = true;
        await app.save();

        // Refund connects if any were spent
        if (app.connectsSpent > 0) {
            await User.findByIdAndUpdate(app.artist, { $inc: { connects: app.connectsSpent } });
            await Transaction.create({
                user: app.artist,
                type: 'refund',
                connects: app.connectsSpent,
                description: `Refund for declined application`,
                job: app.job,
                amount: app.connectsSpent * 0.01,
            });
        }

        res.json({ message: 'Application declined and refunded' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/jobs/:id - Single job (must be last)
router.get('/:id', protect, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('client', 'name username email profilePicture')
            .populate('hiredArtist', 'name username email profilePicture');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;