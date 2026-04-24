import express from 'express';
import { updateMyImage } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.patch('/me/image', protect, uploadSingleImage, updateMyImage);

export default router;
