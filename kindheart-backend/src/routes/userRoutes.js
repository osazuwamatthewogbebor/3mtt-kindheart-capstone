const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getUserProfile,
  uploadImage,
  getUserCampaigns,
  getUserDonations
} = require('../controllers/userController');

// Routes
router.get('/:id', getUserProfile);
router.put('/upload-image', protect, upload.single('image'), uploadImage);
router.get('/:id/campaigns', getUserCampaigns);
router.get('/:id/donations', protect, getUserDonations);

// For backward compatibility with the dashboard
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    ...req.user
  });
});

module.exports = router;
