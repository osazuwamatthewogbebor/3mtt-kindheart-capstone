const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  getUser,
  updateUserRole,
  deleteUser,
  getAdminLogs,
  getRecentActivity
} = require('../controllers/adminController');

// Validation rules
const roleValidation = [
  body('role').isIn(['USER', 'ADMIN']).withMessage('Invalid role')
];

// Routes
router.get('/stats', getStats);
router.get('/users', protect, authorize('ADMIN'), getUsers);
router.get('/users/:id', protect, authorize('ADMIN'), getUser);
router.put('/users/:id/role', protect, authorize('ADMIN'), roleValidation, validate, updateUserRole);
router.delete('/users/:id', protect, authorize('ADMIN'), deleteUser);
router.get('/logs', protect, authorize('ADMIN'), getAdminLogs);
router.get('/activity', protect, authorize('ADMIN'), getRecentActivity);

module.exports = router;
