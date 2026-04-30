import { searchCampaigns } from "../services/campaignSearchService.js";

export const handleSearch = async (req, res) => {
    try {
        const { query, page, limit } = req.query;

        const { campaigns, pagination } = await searchCampaigns(query, page, limit);

        res.status(200).json({
            status: "success",
            data: campaigns,
            pagination
        });
    } catch (error) {
        res.status(500).json({status: "error", message: "Internal server error during search"})
    }
}