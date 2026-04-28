import prisma from '../config/db.js';
import { deleteImageByPublicId, uploadImageBuffer } from '../config/cloudinary.js';


const publicUserSelect = {
	name: true,
};

const toNumber = (value) => Number(value ?? 0);

const calculateTimeLeft = (endDate, now = new Date()) => {
	const remainingMs = Math.max(0, new Date(endDate).getTime() - now.getTime());
	const totalMinutes = Math.floor(remainingMs / 60000);

	return {
		days: Math.floor(remainingMs / 86400000),
		hours: Math.floor((remainingMs % 86400000) / 3600000),
		minutes: totalMinutes % 60,
	};
};

const calculateCampaignStatus = (campaign, now = new Date()) => {
	const startDate = new Date(campaign.startDate).getTime();
	const endDate = new Date(campaign.endDate).getTime();
	const goalAmount = toNumber(campaign.goalAmount);
	const amountRaised = toNumber(campaign.amountRaised);

	if (now.getTime() > endDate) {
		return 'expired';
	}

	if (amountRaised >= goalAmount) {
		return 'fully_funded';
	}

	return 'active';
};

const formatCampaign = (campaign) => {
	const now = new Date();
	const goalAmount = toNumber(campaign.goalAmount);
	const amountRaised = toNumber(campaign.amountRaised);

	return {
		id: campaign.id,
		userId: campaign.userId,
		title: campaign.title,
		description: campaign.description,
		categoryId: campaign.categoryId,
		category: campaign.category
			? {
				id: campaign.category.id,
				name: campaign.category.name,
			}
			: null,
		goalAmount,
		amountRaised,
		imageUrl: campaign.imageUrl,
		imagePublicId: campaign.imagePublicId,
		startDate: campaign.startDate,
		endDate: campaign.endDate,
		status: calculateCampaignStatus(campaign, now),
		time_left: calculateTimeLeft(campaign.endDate, now),
		progress: goalAmount > 0 ? Math.min(100, Number(((amountRaised / goalAmount) * 100).toFixed(2))) : 0,
		creator: campaign.user ? { name: campaign.user.name } : null,
		user: campaign.user ? { ...campaign.user } : null,
		createdAt: campaign.createdAt,
	};
};

const parsePagination = (query) => {
	const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
	const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));

	return { page, limit, skip: (page - 1) * limit };
};

const normalizeStringQuery = (value) => {
	if (Array.isArray(value)) {
		return value[0]?.toString().trim() || '';
	}

	return value?.toString().trim() || '';
};

const buildSearchWhere = (search) => {
	if (!search) {
		return undefined;
	}

	return {
		OR: [
			{ title: { contains: search, mode: 'insensitive' } },
			{ description: { contains: search, mode: 'insensitive' } },
		],
	};
};

const applyStatusFilter = (campaigns, statusFilter) => {
	if (!statusFilter) {
		return campaigns;
	}

	return campaigns.filter((campaign) => campaign.status === statusFilter);
};

const applySorting = (campaigns, sortBy, sortOrder) => {
	const direction = sortOrder === 'asc' ? 1 : -1;
	return [...campaigns].sort((left, right) => {
		const leftValue = left[sortBy];
		const rightValue = right[sortBy];

		if (leftValue < rightValue) {
			return -1 * direction;
		}

		if (leftValue > rightValue) {
			return 1 * direction;
		}

		return 0;
	});
};

const canManageCampaign = (req, campaignUserId) => req.user?.role === 'ADMIN' || campaignUserId === req.user?.id;

export const createCampaign = async (req, res, next) => {
	try {
		if (!req.user?.id) {
			const error = new Error('Authentication required');
			error.statusCode = 401;
			throw error;
		}

		const userId = req.user.id;
		const { title, description, categoryId, goalAmount, endDate } = req.body;
		const parsedGoalAmount = Number(goalAmount);
		const parsedEndDate = new Date(endDate);

		if (
			title === undefined ||
			title === null ||
			title === '' ||
			description === undefined ||
			description === null ||
			description === '' ||
			categoryId === undefined ||
			categoryId === null ||
			categoryId === '' ||
			goalAmount === undefined ||
			goalAmount === null ||
			goalAmount === '' ||
			endDate === undefined ||
			endDate === null ||
			endDate === ''
		) {
			const error = new Error('title, description, categoryId, goalAmount, and endDate are required');
			error.statusCode = 400;
			throw error;
		}

		if (!req.file) {
			const error = new Error('image is required');
			error.statusCode = 400;
			throw error;
		}

		if (!Number.isFinite(parsedGoalAmount) || parsedGoalAmount <= 0) {
			const error = new Error('goalAmount must be greater than 0');
			error.statusCode = 400;
			throw error;
		}

		if (Number.isNaN(parsedEndDate.getTime())) {
			const error = new Error('Invalid date');
			error.statusCode = 400;
			throw error;
		}

		if (parsedEndDate <= new Date()) {
			const error = new Error('endDate must be in the future');
			error.statusCode = 400;
			throw error;
		}


		const category = await prisma.category.findUnique({
			where: { id: categoryId },
			select: { id: true },
		});

		if (!category) {
			const error = new Error('Invalid category');
			error.statusCode = 400;
			throw error;
		}

		let imageUrl;
		let imagePublicId;

		try {
			const uploadResult = await uploadImageBuffer({
				buffer: req.file.buffer,
				mimetype: req.file.mimetype,
				folder: 'campaigns',
			});

			imageUrl = uploadResult.imageUrl;
			imagePublicId = uploadResult.imagePublicId;
		} catch {
			const error = new Error('Cloudinary upload failed');
			error.statusCode = 500;
			throw error;
		}

		const campaign = await prisma.campaign.create({
			data: {
				userId,
				title,
				description,
				categoryId,
				goalAmount: parsedGoalAmount,
				amountRaised: 0,
				imageUrl,
				imagePublicId,
				endDate: parsedEndDate,
			},
			include: {
				user: { select: publicUserSelect },
				category: { select: { id: true, name: true } },
			},
		});

		res.status(201).json({
			success: true,
			campaign: formatCampaign(campaign),
		});
	} catch (error) {
		next(error);
	}
};

export const getCampaigns = async (req, res, next) => {
	try {
		const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
		const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
		const skip = (page - 1) * limit;
		const search = normalizeStringQuery(req.query.search);
		const userId = normalizeStringQuery(req.query.userId);
		const category = normalizeStringQuery(req.query.category);
		const categoryId = Number.parseInt(category, 10);
		const statusFilter = normalizeStringQuery(req.query.status).toLowerCase();
		const requestedSortBy = normalizeStringQuery(req.query.sortBy);
		const sortBy = ['createdAt', 'startDate', 'endDate', 'goalAmount', 'amountRaised'].includes(requestedSortBy)
			? requestedSortBy
			: 'createdAt';
		const sortOrder = normalizeStringQuery(req.query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

		if (statusFilter && !['active', 'fully_funded', 'expired'].includes(statusFilter)) {
			const error = new Error('status must be one of active, fully_funded, or expired');
			error.statusCode = 400;
			throw error;
		}

		const where = {
			...(userId ? { userId } : {}),
			...(category ? { categoryId } : {}),
			...(buildSearchWhere(search) || {}),
		};

		const campaigns = await prisma.campaign.findMany({
			where,
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				user: { select: publicUserSelect },
				category: { select: { id: true, name: true } },
			},
		});

		const formattedCampaigns = campaigns.map(formatCampaign);
		const filteredCampaigns = applyStatusFilter(formattedCampaigns, statusFilter);
		const total = filteredCampaigns.length;
		const paginatedCampaigns = filteredCampaigns.slice(skip, skip + limit);

		res.status(200).json({
			success: true,
			count: paginatedCampaigns.length,
			total,
			page,
			limit,
			campaigns: paginatedCampaigns,
		});
	} catch (error) {
		next(error);
	}
};

export const listCampaigns = getCampaigns;

export const getCampaignById = async (req, res, next) => {
	try {
		const id = req.params.id.trim();

		const campaign = await prisma.campaign.findUnique({
			where: { id },
			include: {
				user: { select: publicUserSelect },
				category: { select: { id: true, name: true } },
			},
		});

		if (!campaign) {
			const error = new Error('Campaign not found');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({
			success: true,
			campaign: formatCampaign(campaign),
		});
	} catch (error) {
		next(error);
	}
};

export const updateCampaign = async (req, res, next) => {
	try {
		const id = Number.parseInt(req.params.id, 10);

		if (!Number.isInteger(id)) {
			const error = new Error('Campaign id must be a valid integer');
			error.statusCode = 400;
			throw error;
		}

		const campaign = await prisma.campaign.findUnique({
			where: { id },
			select: {
				id: true,
				userId: true,
			},
		});

		if (!campaign) {
			const error = new Error('Campaign not found');
			error.statusCode = 404;
			throw error;
		}

		if (!canManageCampaign(req, campaign.userId)) {
			const error = new Error('Forbidden. You can only update your own campaigns.');
			error.statusCode = 403;
			throw error;
		}

		const updateData = {
			...(req.body.title ? { title: req.body.title } : {}),
			...(req.body.description ? { description: req.body.description } : {}),
		};

		const updatedCampaign = await prisma.campaign.update({
			where: { id },
			data: updateData,
			include: {
				user: { select: publicUserSelect },
				category: { select: { id: true, name: true } },
			},
		});

		res.status(200).json({
			success: true,
			message: 'Campaign updated successfully',
			campaign: formatCampaign(updatedCampaign),
		});
	} catch (error) {
		next(error);
	}
};

export const updateCampaignImage = async (req, res, next) => {
	try {
		const id = Number.parseInt(req.params.id, 10);

		if (!Number.isInteger(id)) {
			const error = new Error('Campaign id must be a valid integer');
			error.statusCode = 400;
			throw error;
		}

		if (!req.user?.id) {
			const error = new Error('Authentication required');
			error.statusCode = 401;
			throw error;
		}

		if (!req.file) {
			const error = new Error('image is required');
			error.statusCode = 400;
			throw error;
		}

		const campaign = await prisma.campaign.findUnique({
			where: { id },
			select: {
				id: true,
				userId: true,
				imagePublicId: true,
			},
		});

		if (!campaign) {
			const error = new Error('Campaign not found');
			error.statusCode = 404;
			throw error;
		}

		if (!canManageCampaign(req, campaign.userId)) {
			const error = new Error('Forbidden. You can only update your own campaigns.');
			error.statusCode = 403;
			throw error;
		}

		const { imageUrl, imagePublicId } = await uploadImageBuffer({
			buffer: req.file.buffer,
			mimetype: req.file.mimetype,
			folder: 'campaigns',
		});

		await prisma.campaign.update({
			where: { id },
			data: {
				imageUrl,
				imagePublicId,
			},
		});

		await deleteImageByPublicId(campaign.imagePublicId);

		const updatedCampaign = await prisma.campaign.findUnique({
			where: { id },
			include: {
				user: { select: publicUserSelect },
				category: { select: { id: true, name: true } },
			},
		});

		res.status(200).json({
			success: true,
			message: 'Campaign image updated successfully',
			campaign: formatCampaign(updatedCampaign),
		});
	} catch (error) {
		next(error);
	}
};