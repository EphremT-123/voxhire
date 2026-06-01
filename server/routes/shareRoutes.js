const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Share = require('../models/Share');

// Share a project
router.post('/project/:projectId', protect, async (req, res) => {
    try {
        const share = await Share.create({
            project: req.params.projectId,
            user: req.user._id,
            platform: req.body.platform || 'internal',
        });
        res.status(201).json(share);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get share count for a project
router.get('/project/:projectId/count', protect, async (req, res) => {
    try {
        const count = await Share.countDocuments({ project: req.params.projectId });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;