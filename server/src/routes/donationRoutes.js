import { Router } from "express";
import { getMyDonations, handleNewDonation } from "../controllers/donationController.js";
import { protect, requireVerified } from "../middlewares/authMiddleware.js";


const router = Router();

router.get("/me", protect, requireVerified, getMyDonations);
router.post("/", protect, requireVerified, handleNewDonation);

export default router;