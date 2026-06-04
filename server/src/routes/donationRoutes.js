import { Router } from "express";
import { 
    getMyDonations, 
    handleNewDonation, 
    handlePaymentRedirect, 
    getCampaignDonations, 
    getAllDonations 
} from "../controllers/donationController.js";

import { protect, requireVerified } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { donationSchema } from "../validations/donationValidator.js";
import isAdmin from "../middlewares/isAdmin.js";

const router = Router();

// Base admin/general collection route (Keep parameters flexible)
router.get("/", protect, requireVerified, isAdmin, getAllDonations);

router.get("/campaign/:id", getCampaignDonations);
router.get("/me", protect, requireVerified, getMyDonations);
router.post("/", protect, requireVerified, validateRequest(donationSchema), handleNewDonation);
router.get("/verify-payment", handlePaymentRedirect);

export default router;




