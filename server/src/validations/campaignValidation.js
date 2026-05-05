import { z } from 'zod';

const campaignBaseSchema = z.object({
    title: z.string().trim().min(3, 'title must be at least 3 characters').max(150),
    description: z
    .string()
    .trim()
    .min(20, 'description must be at least 20 characters')
    .max(5000, 'description must be less than or equal to 5000 characters'),
    categoryId:  z.string().uuid({ message: "Invalid Category ID format" }),
    goalAmount: z.coerce.number().positive('goalAmount must be greater than 0'),
    endDate: z.coerce.date(),
});

export const getCampaignByIdSchema = z.object({
    id: z.string("Invalid ID format")
})


export const createCampaignSchema = campaignBaseSchema
    .strict()
    .superRefine((data, ctx) => {
        if (data.endDate <= new Date()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['endDate'],
                message: 'endDate must be in the future',
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
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

