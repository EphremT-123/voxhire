const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('cloudinary').v2;

// Get all posts (feed)
router.get('/', protect, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'name username profilePicture')
            .populate('likes', 'name username')
            .populate('comments.user', 'name username profilePicture')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's posts
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .populate('user', 'name username profilePicture')
            .populate('likes', 'name username')
            .populate('comments.user', 'name username profilePicture')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a post
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        let imageUrl = null;
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                { folder: 'voxhire_posts' }
            );
            imageUrl = result.secure_url;
        }
        const post = await Post.create({ user: req.user._id, text: req.body.text, image: imageUrl });
        const populated = await post.populate('user', 'name username profilePicture');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/Unlike a post
router.post('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        const index = post.likes.indexOf(req.user._id);
        if (index === -1) post.likes.push(req.user._id);
        else post.likes.splice(index, 1);
        await post.save();
        const populated = await Post.findById(post._id)
            .populate('user', 'name username profilePicture')
            .populate('likes', 'name username')
            .populate('comments.user', 'name username profilePicture');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Comment on a post
router.post('/:id/comment', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        post.comments.push({ user: req.user._id, text: req.body.text });
        await post.save();
        const populated = await Post.findById(post._id)
            .populate('user', 'name username profilePicture')
            .populate('likes', 'name username')
            .populate('comments.user', 'name username profilePicture');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Share a post
router.post('/:id/share', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (!post.shares.includes(req.user._id)) post.shares.push(req.user._id);
        await post.save();
        const populated = await Post.findById(post._id)
            .populate('user', 'name username profilePicture')
            .populate('likes', 'name username')
            .populate('comments.user', 'name username profilePicture');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a post
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
        await post.deleteOne();
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;