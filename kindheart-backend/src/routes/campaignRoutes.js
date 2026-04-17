const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getMyCampaigns
} = require('../controllers/campaignController');

// Validation rules
const campaignValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('goal_amount').isFloat({ min: 1 }).withMessage('Goal amount must be greater than 0'),
  body('category_id').notEmpty().withMessage('Category is required')
];

// Routes
router.get('/', getCampaigns);
router.get('/my-campaigns', protect, getMyCampaigns);
router.get('/:id', getCampaign);
router.post('/', protect, upload.single('image'), campaignValidation, validate, createCampaign);
router.put('/:id', protect, upload.single('image'), updateCampaign);
router.delete('/:id', protect, deleteCampaign);

module.exports = router;
