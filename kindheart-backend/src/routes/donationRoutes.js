const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');
const {
  createDonation,
  verifyDonation,
  getDonations,
  getMyDonations,
  getCampaignDonations
} = require('../controllers/donationController');

// Validation rules
const donationValidation = [
  body('campaign_id').notEmpty().withMessage('Campaign ID is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Minimum donation is ₦100'),
  body('email').isEmail().withMessage('Valid email is required')
];

// Routes
router.post('/', donationValidation, validate, createDonation);
router.get('/verify/:reference', verifyDonation);
router.get('/', protect, authorize('ADMIN'), getDonations);
router.get('/my-donations', protect, getMyDonations);
router.get('/campaign/:campaignId', getCampaignDonations);

module.exports = router;
