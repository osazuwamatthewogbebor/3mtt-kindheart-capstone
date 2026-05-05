import {z} from "zod";

export const donationSchema = z.object({
    campaignId: z.uuid.({ message: "Invalid Campaign ID format" }),
    amount: z.coerce.number()
        .positive({ message: "Donation must be greater than 0" })
        .min(100, { message: "Minimum donation is ₦100" })
        .max(10000000, { message: "Amount exceeds single transaction limit" }),
})