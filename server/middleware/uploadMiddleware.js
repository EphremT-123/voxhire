const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept ALL file types - images, audio, video, documents
    const allowed = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        // Audio
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/x-m4a',
        'audio/aac',
        // Video
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        // Documents
        'application/pdf',
        'application/octet-stream',
    ];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Accept anyway for unknown types
        console.log('Unknown MIME type accepted:', file.mimetype);
        cb(null, true);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

module.exports = upload;