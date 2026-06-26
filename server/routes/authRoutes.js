const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

// JWT token generator
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Regular Auth Routes ──────────────────────────────

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;
        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, username, email and password' });
        }
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with that email or username' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            name, username, email, password: hashedPassword,
            role: role || 'client',
            connects: role === 'artist' ? 1247 : 500,
        });
        res.status(201).json({
            _id: user._id, name: user.name, username: user.username,
            email: user.email, role: user.role, connects: user.connects,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
        res.json({
            _id: user._id, name: user.name, username: user.username,
            email: user.email, role: user.role, connects: user.connects,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/auth/me (protected)
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Google Authentication Route ──────────────────────

// POST /api/auth/google
router.post('/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ message: 'No credential provided' });
    }
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });
        if (!user) {
            const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
            user = await User.create({
                name,
                username,
                email,
                password: 'google-oauth-' + googleId,   // not used for Google login
                role: 'client',
                profilePicture: picture || null,
                connects: 500,
            });
        } else {
            // Update profile picture if the user doesn't have one
            if (!user.profilePicture && picture) {
                user.profilePicture = picture;
                await user.save();
            }
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            connects: user.connects,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ message: 'Invalid Google credential' });
    }
});

module.exports = router;