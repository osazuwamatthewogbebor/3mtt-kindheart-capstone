import { Router } from "express";
import { getMyDonations, handleNewDonation, handlePaymentRedirect } from "../controllers/donationController.js";
import { protect, requireVerified } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { donationSchema } from "../validations/donationValidator.js";


const router = Router();

router.get("/me", protect, requireVerified, getMyDonations);
router.post("/", protect, requireVerified, validateRequest(donationSchema), handleNewDonation);
router.get("/verify-payment", handlePaymentRedirect);

export default router;