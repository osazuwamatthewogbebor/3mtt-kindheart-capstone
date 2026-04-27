import prisma from "../config/db.js";
import { PaystackService } from "./paystackService.js";


class DonationService {
    constructor(paymentGateway) {
        this.paymentGateway = paymentGateway
    }

    async createDonation(donorId, email, campaignId, amount) {
        
        // Business logic
        const campaign = await prisma.campaign.findUnique({ 
            where: { id: campaignId }
        });

        // Check if campaign exists
        if (!campaign) throw new Error("Campaign not found");

        // Check Expiry
        if (new Date() > new Date(campaign.endDate)) {
            throw new Error("This campaign has ended and can no longer accept donations.")
        }

        // Check if amount has been achieved
        if (campaign.amountRaised )

        // Prevent self-donation
        if (campaign.userId === donorId) {
            throw new Error("Self-donation is not allowed.")
        }

        // Overfunding Logic
        const goal = Number(campaign.goalAmount);
        const raised = Number(campaign.amountRaised)

        if (raised > goal) {
            throw new Error("The goal has been reached! Thank you for your interest, but this campaign is no longer accepting funds.")
        }


        // Calling payment system
        const payment = await this.paymentGateway.initializePayment(email, amount, {
            campaignId, 
            donorId,
        })

        // Create Donation Record with pending status
        const donationRecord = await prisma.donation.create({
            data: {
                amount: amount,
                reference: payment.reference,
                status: "PENDING",
                donorId: donorId,
                campaignId: campaignId,
            }
        })

        return {
            donation: donationRecord,
            paymentLink: payment.authorization_url
        }
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
            const updatedDonation = await tx.donation.update({
                where: {reference},
                data: {status: "SUCCESS"},
            });

            await tx.campaign.update({
                where: {id: donation.campaignId},
                data: {
                    amountRaised: { increment: parseFloat(donation.amount)}
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