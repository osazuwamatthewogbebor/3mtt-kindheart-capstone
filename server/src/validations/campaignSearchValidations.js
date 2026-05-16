import {z} from "zod";

export const searchSchema = z.object({
    query: z.string().trim().min(2, "Search query must be at least 2 characters").max(500, "Search query too long"),
    category: z.string().trim().min(2, "category name must be at least 2 characters").max(200, "Category name too long").optional(),
    owner: z.string().trim().min(2, "owner name must be at least 2 characters").max(200, "Owner name too long").optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});