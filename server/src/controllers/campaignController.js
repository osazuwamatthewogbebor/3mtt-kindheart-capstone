import prisma from '../config/db.js';

const publicUserSelect = {
	id: true,
	name: true,
	profile_picture: true,
	created_at: true,
};

const toNumber = (value) => Number(value ?? 0);

const calculateTimeLeft = (endDate, now = new Date()) => {
	const remainingMs = Math.max(0, new Date(endDate).getTime() - now.getTime());
	const totalMinutes = Math.floor(remainingMs / 60000);

	return {
		milliseconds: remainingMs,
		days: Math.floor(remainingMs / 86400000),
		hours: Math.floor((remainingMs % 86400000) / 3600000),
		minutes: totalMinutes % 60,
	};
};

const calculateCampaignStatus = (campaign, now = new Date()) => {
	const startDate = new Date(campaign.startDate).getTime();
	const endDate = new Date(campaign.endDate).getTime();
	const goalAmount = toNumber(campaign.goalAmount);
	const raisedAmount = toNumber(campaign.raisedAmount);

	if (raisedAmount >= goalAmount) {
		return 'COMPLETED';
	}

	if (now.getTime() < startDate) {
		return 'UPCOMING';
	}

	if (now.getTime() > endDate) {
		return 'EXPIRED';
	}

	return 'ACTIVE';
};

const formatCampaign = (campaign) => {
	const now = new Date();
	const goalAmount = toNumber(campaign.goalAmount);
	const raisedAmount = toNumber(campaign.raisedAmount);

	return {
		id: campaign.id,
		userId: campaign.userId,
		title: campaign.title,
		description: campaign.description,
		goalAmount,
		raisedAmount,
		startDate: campaign.startDate,
		endDate: campaign.endDate,
		status: calculateCampaignStatus(campaign, now),
		time_left: calculateTimeLeft(campaign.endDate, now),
		progress: goalAmount > 0 ? Math.min(100, Number(((raisedAmount / goalAmount) * 100).toFixed(2))) : 0,
		user: campaign.user ? { ...campaign.user } : null,
		createdAt: campaign.createdAt,
		updatedAt: campaign.updatedAt,
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

export const createCampaign = async (req, res, next) => {
	try {
		const { title, description, goalAmount, startDate, endDate } = req.body;
		const campaign = await prisma.campaign.create({
			data: {
				userId: req.user.id,
				title,
				description,
				goalAmount,
				startDate: startDate ?? new Date(),
				endDate,
			},
			include: {
				user: { select: publicUserSelect },
			},
		});

		res.status(201).json({
			success: true,
			message: 'Campaign created successfully',
			campaign: formatCampaign(campaign),
		});
	} catch (error) {
		next(error);
	}
};

export const listCampaigns = async (req, res, next) => {
	try {
		const { page, limit, skip } = parsePagination(req.query);
		const search = normalizeStringQuery(req.query.search);
		const userId = normalizeStringQuery(req.query.userId);
		const statusFilter = normalizeStringQuery(req.query.status).toUpperCase();
		const requestedSortBy = normalizeStringQuery(req.query.sortBy);
		const sortBy = ['createdAt', 'startDate', 'endDate', 'goalAmount', 'raisedAmount'].includes(requestedSortBy)
			? requestedSortBy
			: 'createdAt';
		const sortOrder = normalizeStringQuery(req.query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

		if (statusFilter && !['UPCOMING', 'ACTIVE', 'COMPLETED', 'EXPIRED'].includes(statusFilter)) {
			const error = new Error('status must be one of UPCOMING, ACTIVE, COMPLETED, or EXPIRED');
			error.statusCode = 400;
			throw error;
		}

		const where = {
			...(userId ? { userId } : {}),
			...(buildSearchWhere(search) || {}),
		};

		const campaigns = await prisma.campaign.findMany({
			where,
			include: {
				user: { select: publicUserSelect },
			},
		});

		const formattedCampaigns = applySorting(
			applyStatusFilter(campaigns.map(formatCampaign), statusFilter),
			sortBy,
			sortOrder,
		);
		const paginatedCampaigns = formattedCampaigns.slice(skip, skip + limit);

		res.status(200).json({
			success: true,
			count: paginatedCampaigns.length,
			total: formattedCampaigns.length,
			page,
			limit,
			campaigns: paginatedCampaigns,
		});
	} catch (error) {
		next(error);
	}
};

export const getCampaignById = async (req, res, next) => {
	try {
		const { id } = req.params;
		const campaign = await prisma.campaign.findUnique({
			where: { id },
			include: {
				user: { select: publicUserSelect },
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
		const { id } = req.params;
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

		if (req.user.role !== 'ADMIN' && campaign.userId !== req.user.id) {
			const error = new Error('Forbidden. You can only update your own campaigns.');
			error.statusCode = 403;
			throw error;
		}

		const updateData = {
			...(req.body.title ? { title: req.body.title } : {}),
			...(req.body.description ? { description: req.body.description } : {}),
			...(typeof req.body.goalAmount === 'number' ? { goalAmount: req.body.goalAmount } : {}),
			...(req.body.startDate ? { startDate: req.body.startDate } : {}),
		};

		const updatedCampaign = await prisma.campaign.update({
			where: { id },
			data: updateData,
			include: {
				user: { select: publicUserSelect },
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