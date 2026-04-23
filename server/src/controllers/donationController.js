import donationService from "../services/donationService.js";

export const handleNewDonation = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const {id: donorId, email } = req.user;

        const donation = await donationService.createDonation(donorId, email, campaignId, amount);

        res.status(201).json({ status: "success", data: donation });

    } catch (error) {
        res.status(400).json({status: "error", message: error.message})
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