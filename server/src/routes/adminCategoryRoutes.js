import express from 'express';
import {
	createCategory,
	deleteCategory,
	listCategories,
	updateCategory,
} from '../controllers/adminCategoryController.js';
import { authorizeRoles, protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('ADMIN'));

router.get('/', listCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
