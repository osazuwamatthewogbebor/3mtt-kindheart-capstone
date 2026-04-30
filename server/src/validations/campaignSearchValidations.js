import {z} from "zod";

export const searchSchema = z.object({
    query: z.string().trim().min(2, "Search query must be at least 2 characters"),
    category: z.string().trim().optional(),
    owner: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});