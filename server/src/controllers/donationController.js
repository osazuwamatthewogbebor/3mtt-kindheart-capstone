import donationService from "../services/donationService.js";

export const handleNewDonation = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const {id: donorId, email } = req.user;

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

        if (!reference) {
            return res.status(400).json({ status: "error", message: "No reference found" })
        }

        const donation = await donationService.finalizeDonation(reference);

        if (!donation) {
            return res.status(400).json({ status: "error", message: "Payment verification failed" });
        }

        if (donation) {
            // Redirect back to success screen
            res.redirect(`http://localhost:5173/donation-success?status=success&ref=${reference}`);
        } else {
            res.redirect(`http://localhost:5173/donation-failure`);
        }
        
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

export const getMyDonations = async (req, res) => {
    try {
        const donations = await donationService.getDonationsByUser(req.user.id);
        res.status(200).json({ status: "success", data: donations});
    } catch (error) {
        res.status(500).json({status: "error", message: error.message})
    }
}