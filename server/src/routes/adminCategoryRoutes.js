import express from 'express';
import {
	createCategory,
	deleteCategory,
	listCategories,
	updateCategory,
} from '../controllers/adminCategoryController.js';
import { isAuth, requireVerified } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/isAdmin.js';

const router = express.Router();

router.use(isAuth, requireVerified, isAdmin);

router.get('/', listCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
