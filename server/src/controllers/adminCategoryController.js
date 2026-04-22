import prisma from '../config/db.js';

const parseCategoryId = (value) => {
	const id = Number.parseInt(value, 10);
	return Number.isInteger(id) ? id : null;
};

const normalizeCategoryName = (value) => value?.toString().trim();

export const listCategories = async (req, res, next) => {
	try {
		const categories = await prisma.category.findMany({
			orderBy: {
				name: 'asc',
			},
		});

		res.status(200).json({
			success: true,
			count: categories.length,
			categories,
		});
	} catch (error) {
		next(error);
	}
};

export const createCategory = async (req, res, next) => {
	try {
		const name = normalizeCategoryName(req.body?.name);

		if (!name) {
			const error = new Error('name is required');
			error.statusCode = 400;
			throw error;
		}

		const existingCategory = await prisma.category.findUnique({
			where: { name },
			select: { id: true },
		});

		if (existingCategory) {
			const error = new Error('Category name must be unique');
			error.statusCode = 409;
			throw error;
		}

		const category = await prisma.category.create({
			data: { name },
		});

		res.status(201).json({
			success: true,
			message: 'Category created successfully',
			category,
		});
	} catch (error) {
		next(error);
	}
};

export const updateCategory = async (req, res, next) => {
	try {
		const id = parseCategoryId(req.params.id);
		const name = normalizeCategoryName(req.body?.name);

		if (!id) {
			const error = new Error('Category id must be a valid integer');
			error.statusCode = 400;
			throw error;
		}

		if (!name) {
			const error = new Error('name is required');
			error.statusCode = 400;
			throw error;
		}

		const category = await prisma.category.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!category) {
			const error = new Error('Category not found');
			error.statusCode = 404;
			throw error;
		}

		const duplicateCategory = await prisma.category.findUnique({
			where: { name },
			select: { id: true },
		});

		if (duplicateCategory && duplicateCategory.id !== id) {
			const error = new Error('Category name must be unique');
			error.statusCode = 409;
			throw error;
		}

		const updatedCategory = await prisma.category.update({
			where: { id },
			data: { name },
		});

		res.status(200).json({
			success: true,
			message: 'Category updated successfully',
			category: updatedCategory,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteCategory = async (req, res, next) => {
	try {
		const id = parseCategoryId(req.params.id);

		if (!id) {
			const error = new Error('Category id must be a valid integer');
			error.statusCode = 400;
			throw error;
		}

		const category = await prisma.category.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!category) {
			const error = new Error('Category not found');
			error.statusCode = 404;
			throw error;
		}

		await prisma.category.delete({
			where: { id },
		});

		res.status(200).json({
			success: true,
			message: 'Category deleted successfully',
		});
	} catch (error) {
		if (error.code === 'P2003') {
			const foreignKeyError = new Error('Cannot delete category that is in use by campaigns');
			foreignKeyError.statusCode = 409;
			return next(foreignKeyError);
		}

		next(error);
	}
};
