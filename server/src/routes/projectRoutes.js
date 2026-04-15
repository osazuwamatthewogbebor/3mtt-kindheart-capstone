import express from 'express';
import { protect, requireVerified } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, requireVerified, (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    createdBy: req.user.id,
  });
});

router.post('/:projectId/donate', protect, (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Donation submitted successfully',
    projectId: req.params.projectId,
    donatedBy: req.user.id,
  });
});

router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Projects route is active',
  });
});

export default router;
