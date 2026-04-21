import { z } from 'zod';

const campaignBaseSchema = z.object({
	title: z.string().trim().min(3, 'title must be at least 3 characters').max(150),
	description: z
		.string()
		.trim()
		.min(20, 'description must be at least 20 characters')
		.max(5000, 'description must be less than or equal to 5000 characters'),
	goalAmount: z.coerce.number().positive('goalAmount must be greater than 0'),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date(),
});

export const createCampaignSchema = campaignBaseSchema
	.strict()
	.superRefine((data, ctx) => {
		const startDate = data.startDate ?? new Date();

		if (data.endDate <= startDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['endDate'],
				message: 'endDate must be after startDate',
			});
		}
	});

export const updateCampaignSchema = z
	.object({
		title: z.string().trim().min(3, 'title must be at least 3 characters').max(150).optional(),
		description: z
			.string()
			.trim()
			.min(20, 'description must be at least 20 characters')
			.max(5000, 'description must be less than or equal to 5000 characters')
			.optional(),
		goalAmount: z.coerce.number().positive('goalAmount must be greater than 0').optional(),
		startDate: z.coerce.date().optional(),
	})
	.strict()
	.refine((data) => Object.keys(data).length > 0, 'At least one field is required');