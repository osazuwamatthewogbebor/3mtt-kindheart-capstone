import express from 'express';
import { updateMyImage, getUserStats } from '../controllers/userController.js';
import { protect, requireVerified } from '../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.patch('/me/image', protect, requireVerified, uploadSingleImage, updateMyImage);
router.get('/:id', protect, getUserStats);

export default router;
