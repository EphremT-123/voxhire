const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['artist', 'client', 'admin'], default: 'client' },
    balance: { type: Number, default: 1000 },
    connects: { type: Number, default: 500 },
    profilePicture: { type: String, default: null },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    experience: { type: String, default: '' },
    rating: { type: String, default: 'New' },
    languages: { type: String, default: '' },
    equipment: { type: String, default: '' },
    companySize: { type: String, default: '' },
    industry: { type: String, default: '' },
    portfolio: [{
        title: { type: String, default: 'Untitled' },
        url: { type: String, required: true },
        type: { type: String, enum: ['audio', 'video', 'link', 'image'], default: 'audio' },
        description: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    showEmail: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);