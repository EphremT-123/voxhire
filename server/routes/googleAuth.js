const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/google
router.post('/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'No credential provided' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // Check if user already exists by email
        let user = await User.findOne({ email });

        if (!user) {
            // Create a new user with a random username (based on email prefix)
            const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
            user = await User.create({
                name,
                username,
                email,
                password: 'google-oauth-' + googleId, // dummy password, not used
                role: 'client', // default role, can be changed later
                profilePicture: picture || null,
                connects: 500,
            });
        } else {
            // Update profile picture if not set
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