import prisma from '../config/db.js';
import { logAdminAction } from '../services/auditLogService.js';

export const getStats = async (req, res, next) => {
	try {
		// Fetch all required statistics in parallel
		const [
			totalUsersResult,
			totalCampaignsResult,
			totalDonationsResult,
			totalAmountDonatedResult,
			totalAmountRaisedResult,
		] = await Promise.all([
			// Count total users
			prisma.user.count(),

			// Count total campaigns
			prisma.campaign.count(),

			// Count total donations
			prisma.donation.count(),

			// Sum of successful donations
			prisma.donation.aggregate({
				where: {
					status: 'SUCCESS',
				},
				_sum: {
					amount: true,
				},
			}),

			// Sum of campaign amountRaised
			prisma.campaign.aggregate({
				_sum: {
					amountRaised: true,
				},
			}),
		]);

		res.status(200).json({
			success: true,
			data: {
				totalUsers: totalUsersResult,
				totalCampaigns: totalCampaignsResult,
				totalDonations: totalDonationsResult,
				totalAmountDonated: totalAmountDonatedResult._sum.amount || 0,
				totalAmountRaised: totalAmountRaisedResult._sum.amountRaised || 0,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getUsers = async (req, res, next) => {
	try {
		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		res.status(200).json({
			success: true,
			count: users.length,
			data: users,
		});
	} catch (error) {
		next(error);
	}
};

export const updateCampaignStatus = async (req, res, next) => {
	try {
		const id = req.params.id?.trim();
		const { status, rejectionReason } = req.body;

		if (!id) {
			const error = new Error('Campaign id is required');
			error.statusCode = 400;
			throw error;
		}

		const campaign = await prisma.campaign.findUnique({
			where: { id },
			select: { id: true, title: true },
		});

		if (!campaign) {
			const error = new Error('Campaign not found');
			error.statusCode = 404;
			throw error;
		}

		const updateData = {
			campaignStatus: status,
		};

		if (status === 'REJECTED' && rejectionReason) {
			updateData.rejectionReason = rejectionReason;
		}

		const updatedCampaign = await prisma.campaign.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				title: true,
				campaignStatus: true,
				rejectionReason: true,
				updatedAt: true,
			},
		});

		// Log the action
		await logAdminAction(
			req.user.id,
			`CAMPAIGN_${status}`,
			'Campaign',
			id,
			{ campaignTitle: campaign.title, rejectionReason }
		);

		res.status(200).json({
			success: true,
			message: 'Campaign status updated successfully',
			campaign: updatedCampaign,
		});
	} catch (error) {
		next(error);
	}
};

export const getCampaigns = async (req, res, next) => {
	try {
		const page = Math.max(1, parseInt(req.query.page) || 1);
		const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
		const skip = (page - 1) * limit;

		const [campaigns, total] = await Promise.all([
			prisma.campaign.findMany({
				select: {
					id: true,
					title: true,
					goalAmount: true,
					amountRaised: true,
					campaignStatus: true,
					endDate: true,
					createdAt: true,
					user: {
						select: {
							name: true,
						},
					},
					category: {
						select: {
							name: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
				skip,
				take: limit,
			}),
			prisma.campaign.count(),
		]);

		// Transform to flatten nested objects
		const formattedCampaigns = campaigns.map((campaign) => ({
			id: campaign.id,
			title: campaign.title,
			goalAmount: campaign.goalAmount,
			amountRaised: campaign.amountRaised,
			campaignStatus: campaign.campaignStatus,
			endDate: campaign.endDate,
			createdAt: campaign.createdAt,
			creator: campaign.user.name,
			category: campaign.category.name,
		}));

		res.status(200).json({
			success: true,
			count: formattedCampaigns.length,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
			data: formattedCampaigns,
		});
	} catch (error) {
		next(error);
	}
};

export const bulkUpdateCampaignStatus = async (req, res, next) => {
	try {
		const { campaignIds, status, rejectionReason } = req.body;

		if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
			const error = new Error('campaignIds array is required and must not be empty');
			error.statusCode = 400;
			throw error;
		}

		if (!['APPROVED', 'REJECTED'].includes(status)) {
			const error = new Error('status must be APPROVED or REJECTED');
			error.statusCode = 400;
			throw error;
		}

		if (status === 'REJECTED' && !rejectionReason) {
			const error = new Error('rejectionReason is required when status is REJECTED');
			error.statusCode = 400;
			throw error;
		}

		const updateData = {
			campaignStatus: status,
		};

		if (status === 'REJECTED' && rejectionReason) {
			updateData.rejectionReason = rejectionReason;
		}

		const result = await prisma.campaign.updateMany({
			where: {
				id: { in: campaignIds },
			},
			data: updateData,
		});

		// Log the action
		await logAdminAction(
			req.user.id,
			`BULK_CAMPAIGN_${status}`,
			'Campaign',
			null,
			{ count: result.count, campaignIds, rejectionReason }
		);

		res.status(200).json({
			success: true,
			message: `${result.count} campaigns updated successfully`,
			updated: result.count,
		});
	} catch (error) {
		next(error);
	}
};
