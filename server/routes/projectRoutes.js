const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    getProject,
    placeBid,
    acceptBid,
    getBids,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public (but logged in) routes
router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.get('/:id/bids', protect, getBids);

// Client only routes
router.post('/', protect, authorize('client'), createProject);
router.put('/:projectId/accept-bid/:bidId', protect, authorize('client'), acceptBid);

// Artist only route
router.post('/:id/bid', protect, authorize('artist'), placeBid);

module.exports = router;
