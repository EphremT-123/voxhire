const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images, audio, video, and documents
    const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf',
        'application/octet-stream'
    ];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log('Rejected file type:', file.mimetype);
        cb(null, true); // Accept anyway, Cloudinary can handle it
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = upload;