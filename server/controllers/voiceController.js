const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const VoiceProfile = require('../models/VoiceProfile');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

const mapEmotionToStyle = (emotion) => {
    const mapping = {
        angry: 'raspy',
        calm: 'warm',
        happy: 'bright',
        sad: 'monotone',
        fearful: 'breathy',
        surprised: 'clear',
    };
    return mapping[emotion] || 'neutral';
};

exports.createProfile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No audio file uploaded' });

        // 1. Upload to Cloudinary (base64 from memory)
        const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(b64, {
            resource_type: 'auto',
            folder: 'voxhire_demos',
        });
        const demoUrl = result.secure_url;

        // 2. AI analysis via Hugging Face
        let aiVoiceTag = 'neutral';
        try {
            const hfResponse = await axios.post(
                'https://api-inference.huggingface.co/models/ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition',
                req.file.buffer,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                        'Content-Type': 'application/octet-stream',
                    },
                }
            );
            const predictions = hfResponse.data;
            const topEmotion = predictions.reduce((prev, curr) =>
                prev.score > curr.score ? prev : curr
            );
            aiVoiceTag = mapEmotionToStyle(topEmotion.label);
        } catch (aiErr) {
            console.warn('AI fallback – using neutral:', aiErr.message);
        }

        // 3. Parse request body
        const { language, accent, gender, selfVoiceStyle } = req.body;
        let styles = selfVoiceStyle;
        if (typeof selfVoiceStyle === 'string') {
            styles = selfVoiceStyle.split(',').map(s => s.trim());
        }

        // 4. Upsert profile
        const profile = await VoiceProfile.findOneAndUpdate(
            { user: req.user._id },
            {
                user: req.user._id,
                language,
                accent,
                gender,
                selfVoiceStyle: styles || [],
                aiVoiceStyle: [aiVoiceTag],
                demoUrl,
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profile = await VoiceProfile.findOne({ user: req.user._id });
        if (!profile) return res.status(404).json({ message: 'No profile found' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};