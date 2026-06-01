const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');

// Get comments for a project
router.get('/project/:projectId', protect, async (req, res) => {
    try {
        const comments = await Comment.find({ project: req.params.projectId })
            .populate('user', 'name username')
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a comment
router.post('/project/:projectId', protect, async (req, res) => {
    try {
        const comment = await Comment.create({
            project: req.params.projectId,
            user: req.user._id,
            text: req.body.text,
        });
        const populated = await comment.populate('user', 'name username');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;