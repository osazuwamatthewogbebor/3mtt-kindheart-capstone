const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Validation rules
const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required')
];

// Routes
router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', protect, authorize('ADMIN'), categoryValidation, validate, createCategory);
router.put('/:id', protect, authorize('ADMIN'), categoryValidation, validate, updateCategory);
router.delete('/:id', protect, authorize('ADMIN'), deleteCategory);

module.exports = router;
