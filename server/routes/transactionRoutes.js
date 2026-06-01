const express = require('express');
const router = express.Router();
const { fundProject, deliverWork, approveWork, disputeWork } = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/projects/:id/fund', protect, authorize('client'), fundProject);
router.post('/projects/:id/deliver', protect, authorize('artist'), upload.single('audio'), deliverWork);
router.put('/projects/:id/approve', protect, authorize('client'), approveWork);
router.put('/projects/:id/dispute', protect, authorize('client'), disputeWork);

module.exports = router;