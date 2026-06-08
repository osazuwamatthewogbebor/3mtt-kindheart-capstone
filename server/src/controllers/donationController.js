import donationService from "../services/donationService.js";
import prisma from "../config/db.js";

export const handleNewDonation = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const {id: donorId, email } = req.user;

        // Fetch campaign to check owner
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { userId: true }
        });

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        if (campaign.userId === donorId) {
            throw new Error("Self donation is not allowed");
        }

        const result = await donationService.createDonation(donorId, email, campaignId, amount);

        res.status(201).json({ 
            status: "success", 
            data: result.donation,
            authorization_url: result.paymentLink
        });

    } catch (error) {
        res.status(400).json({status: "error", message: error.message})
    }
}

export const handlePaymentRedirect = async (req, res) => {
    try {
        const { reference } = req.query
        const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";

        if (!reference) {
            return res.status(400).json({ status: "error", message: "No reference found" })
        }

        const donation = await donationService.finalizeDonation(reference);

        if (!donation) {
            const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
            return res.redirect(`${frontendUrl}/pages/donations-failure.html?ref=${reference}`);
        }

        if (donation) {
            // Redirect back to success screen
            res.redirect(`${frontendUrl}/pages/donation-success.html?status=success&ref=${reference}`);
        }
        
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

export const getAllDonations = async (req, res) => {
    try {
        const { limit, page, sort, status } = req.query;

        const result = await donationService.getAllDonations({
            limit,
            page,
            sort,
            status
        });

        res.status(200).json({
            status: "success",
            meta: result.meta,
            data: result.donations
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
};

export const getMyDonations = async (req, res) => {
    try {
        const donations = await donationService.getDonationsByUser(req.user.id);
        res.status(200).json({ status: "success", data: donations });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

export const getCampaignDonations = async (req, res) => {
    try {
        const donations = await donationService.getDonationsByCampaign(req.params.id);
        res.status(200).json({ status: "success", count: donations.length, data: donations });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}
