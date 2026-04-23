import { Router } from "express";
import { verifyPaystackWebhook } from "../middlewares/paymentMiddleware.js"
import { donationPaystackWebHook } from "../controllers/webhookController.js";

const router = Router();

/**
 * PATH: /api/payments/webhook
 * 
 */
router.post("/webhook", verifyPaystackWebhook, donationPaystackWebHook);

export default router;