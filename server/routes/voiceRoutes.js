const express = require('express');
const router = express.Router();
const { createProfile, getProfile } = require('../controllers/voiceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(authorize('artist'));

router.post('/profile', upload.single('audio'), createProfile);
router.get('/profile', getProfile);

module.exports = router;