import prisma from "../config/db.js";
import { donationSchema } from "../validations/donationValidator.js";
import { PaystackService } from "./paystackService.js";


class DonationService {
    constructor(paymentGateway) {
        this.paymentGateway = paymentGateway
    }

    async createDonation(donorId, email, payload) {
        // Validation checks
        const validatedData = donationSchema.parse(payload);
        const { campaignId, amount } = validatedData;

        
        // Business logic
        const campaign = await prisma.campaign.findUnique({ 
            where: { id: campaignId }
        });

        // Check if campaign exists
        if (!campaign) throw new Error("Campaign not found");

        // Check Expiry
        if (new Date() > new Date(campaign.endDate)) {
            throw new Error("This campaing has ended and can no longer accept donations.")
        }

        // Prevent self-donation
        if (campaign.userId === donorId) {
            throw new Error("Self-donation is not allowed.")
        }

        // Calling payment system
        const payment = await this.paymentGateway.initializePayment(email, amount, {
            campaignId, 
            donorId,
        })

        // Create Donation Record with pending status
        return await prisma.donation.create({
            data: {
                amount: amount,
                reference: payment.reference,
                status: "PENDING",
                donorId: donorId,
                campaignId: campaignId,
            }
        })
    }

    async finalizeDonation(reference) {
        const paymentVerification = await this.paymentGateway.verifyPayment(reference);

        if (paymentVerification.status !== "success") {
            await prisma.donation.update({
                where: { reference },
                data: { status: "FAILED"}
            });
            return null;
        }

        // Idempotency check
        const donation = await prisma.donation.findUnique({
            where: {reference}
        });

        // If it doesn't exist or is already successful, don't double-process
        if (!donation || donation.status === "SUCCESS") {
            return donation
        }
        
        // ATOMIC TRANSACTION: Only update if verification is solid
        return await prisma.$transaction(async (tx) => {
            // Update Donation Status
            const updatedDonation = await tx.donation.update({
                where: {reference},
                data: {status: "SUCCESS"},
            });

            // Update campaign raised amount (Atomic update)
            await tx.campaign.update({
                where: {id: donation.campaignId},
                data: {
                    raisedAmount: { increment: donation.amount}
                }
            });

            return updatedDonation;
        })
    }

    async getDonationsByUser(userId) {
        return await prisma.donation.findMany({
            where: { donorId: userId},
            include: { campaign: { select: {title: true}}},
            orderBy: { createdAt: "desc"}
        })
    }
}


export default new DonationService(new PaystackService());