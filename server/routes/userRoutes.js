const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('cloudinary').v2;
const Job = require('../models/Job');
const Application = require('../models/Application');

// Search users (with privacy: artists can't see clients)
router.get('/search', protect, async (req, res) => {
    try {
        const { q } = req.query;
        let users = await User.find({ username: { $regex: q, $options: 'i' } })
            .select('name username email role bio location profilePicture');
        // Artists cannot see clients in search
        if (req.user.role === 'artist') {
            users = users.filter(u => u.role !== 'client');
        }
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get contacts for chat sidebar
router.get('/contacts', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;
        let contacts = [];

        if (role === 'client') {
            // Clients see artists who have applied to any of their jobs (including invitations)
            const clientJobs = await Job.find({ client: userId }).select('_id');
            const jobIds = clientJobs.map(j => j._id);
            const applications = await Application.find({ job: { $in: jobIds } })
                .populate('artist', 'name username email profilePicture role')
                .select('artist');

            const artistMap = {};
            applications.forEach(app => {
                if (app.artist && app.artist._id) {
                    artistMap[app.artist._id.toString()] = app.artist;
                }
            });
            contacts = Object.values(artistMap);
        } else if (role === 'artist') {
            // Artists see clients who have interacted with them (applications to their jobs, or invitations received)
            const apps = await Application.find({ artist: userId })
                .populate('job', 'client title')
                .lean();
            const clientMap = {};
            for (const app of apps) {
                if (app.job && app.job.client) {
                    const client = await User.findById(app.job.client)
                        .select('name username email profilePicture role');
                    if (client) clientMap[client._id.toString()] = client;
                }
            }
            contacts = Object.values(clientMap);
        }

        res.json(contacts);
    } catch (error) {
        console.error('Contacts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile by ID (with privacy: artists can't view client profiles)
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followers', 'name username profilePicture')
            .populate('following', 'name username profilePicture');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Block artists from viewing client profiles (except own)
        if (req.user.role === 'artist' && user.role === 'client' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You cannot view this profile.' });
        }

        const userData = user.toObject();
        if (!userData.showEmail) userData.email = 'Hidden';
        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload profile picture
router.post('/profile-picture', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            { folder: 'voxhire_profiles', width: 400, height: 400, crop: 'fill' }
        );
        await User.findByIdAndUpdate(req.user._id, { profilePicture: result.secure_url });
        res.json({ profilePicture: result.secure_url });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const allowedFields = ['name', 'bio', 'location', 'website', 'experience', 'languages', 'equipment', 'companySize', 'industry', 'showEmail'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add portfolio item
router.post('/portfolio', protect, upload.single('file'), async (req, res) => {
    try {
        let url = req.body.url || '';
        let type = req.body.type || 'audio';
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                { resource_type: 'auto', folder: 'voxhire_portfolios' }
            );
            url = result.secure_url;
            if (req.file.mimetype.startsWith('video/')) type = 'video';
            else if (req.file.mimetype.startsWith('audio/')) type = 'audio';
            else if (req.file.mimetype.startsWith('image/')) type = 'image';
        }
        const portfolioItem = {
            title: req.body.title || 'Untitled',
            url,
            type,
            description: req.body.description || '',
            createdAt: new Date()
        };
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { portfolio: portfolioItem } },
            { new: true }
        ).select('-password');
        res.json(user.portfolio);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete portfolio item
router.delete('/portfolio/:itemId', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { portfolio: { _id: req.params.itemId } } },
            { new: true }
        ).select('-password');
        res.json(user.portfolio);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Follow/Unfollow
router.post('/:id/follow', protect, async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot follow yourself' });
        const userToFollow = await User.findById(req.params.id);
        if (!userToFollow) return res.status(404).json({ message: 'User not found' });
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });
        await User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } });
        res.json({ message: 'Followed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:id/unfollow', protect, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
        await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get followers/following
router.get('/:id/followers', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers', 'name username profilePicture role');
        res.json(user?.followers || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id/following', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('following', 'name username profilePicture role');
        res.json(user?.following || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Buy connects
router.post('/buy-connects', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
        await User.findByIdAndUpdate(req.user._id, { $inc: { connects: amount } });
        const user = await User.findById(req.user._id).select('connects');
        res.json({ connects: user.connects, message: `Added ${amount} connects!` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;