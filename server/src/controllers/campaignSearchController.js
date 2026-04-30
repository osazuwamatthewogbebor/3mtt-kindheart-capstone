import { searchCampaigns } from "../services/campaignSearchService.js";

export const handleSearch = async (req, res, next) => {
    try {
        
        const results = await searchCampaigns(req.query);

        res.status(200).json({
            status: "success",
            ...results
        });
    } catch (error) {
        return next(error)
    }
}