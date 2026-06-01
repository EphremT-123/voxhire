const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('cloudinary').v2;

// Calculate connect cost
const calculateConnectCost = (budget, urgency) => {
    let base = Math.max(50, Math.min(500, Math.floor(budget / 5)));
    if (urgency === 'urgent') base = Math.min(500, Math.floor(base * 1.5));
    if (urgency === 'super_urgent') base = Math.min(500, Math.floor(base * 2));
    return base;
};

// GET /api/jobs - Get all open jobs
router.get('/', protect, async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'open' })
            .populate('client', 'name username email profilePicture')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/jobs/my/applications - Artist's applications
router.get('/my/applications', protect, authorize('artist'), async (req, res) => {
    try {
        console.log('Fetching applications for artist:', req.user._id);
        const applications = await Application.find({ artist: req.user._id })
            .populate('job', 'title budget deadline clientName status urgency')
            .sort({ createdAt: -1 });
        console.log('Found applications:', applications.length);
        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
        console.log('Job created:', job._id);
        res.status(201).json({ job, remainingConnects: user.connects });
    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/jobs/:id/apply - Apply with optional portfolio
router.post('/:id/apply', protect, authorize('artist'), async (req, res) => {
    try {
        console.log('Apply request received for job:', req.params.id);
        console.log('User:', req.user._id, req.user.name);
        console.log('Body:', req.body);
        console.log('File:', req.file ? req.file.originalname : 'No file');

        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.status !== 'open') return res.status(400).json({ message: 'Job is not open' });

        const existingApp = await Application.findOne({ job: job._id, artist: req.user._id });
        if (existingApp) return res.status(400).json({ message: 'Already applied to this job' });

        const user = await User.findById(req.user._id);
        if (user.connects < 10) return res.status(400).json({ message: 'Insufficient connects (need 10)' });

        user.connects -= 10;
        await user.save();

        let portfolioUrl = req.body.portfolioUrl || null;
        let portfolioFile = null;

        // If a file was uploaded, send to Cloudinary
        if (req.file) {
            try {
                console.log('Uploading file to Cloudinary...');
                const result = await cloudinary.uploader.upload(
                    `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                    { resource_type: 'auto', folder: 'voxhire_portfolios' }
                );
                portfolioFile = result.secure_url;
                console.log('File uploaded:', portfolioFile);
            } catch (uploadErr) {
                console.error('Cloudinary upload error:', uploadErr);
                // Continue even if upload fails
            }
        }

        const application = await Application.create({
            job: job._id,
            artist: req.user._id,
            artistName: user.name,
            coverLetter: req.body.coverLetter || '',
            portfolioUrl,
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

        console.log('Application created:', application._id);
        res.status(201).json({ application, remainingConnects: user.connects });
    } catch (error) {
        console.error('Apply error:', error);
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

        // Decline others and refund
        const otherApps = await Application.find({
            job: job._id,
            _id: { $ne: app._id },
            status: { $in: ['pending', 'shortlisted'] }
        });
        for (const otherApp of otherApps) {
            otherApp.status = 'declined';
            otherApp.refunded = true;
            await otherApp.save();
            await User.findByIdAndUpdate(otherApp.artist, { $inc: { connects: 10 } });
        }

        const hiredArtist = await User.findById(app.artist).select('name username email profilePicture');
        res.json({ message: 'Artist hired!', job, hiredArtist });
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

        await User.findByIdAndUpdate(app.artist, { $inc: { connects: 10 } });
        res.json({ message: 'Application declined and refunded' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/jobs/:id - Single job (MUST BE LAST)
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