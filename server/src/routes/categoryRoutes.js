import express from 'express';
import { listCategories } from '../controllers/adminCategoryController.js';

const router = express.Router();

// Public categories listing (no auth required)
router.get('/', listCategories);

export default router;
