import express from 'express';
import { deleteUploadByPublicId } from '../controllers/uploadController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.delete('/:public_id', protect, deleteUploadByPublicId);

export default router;
