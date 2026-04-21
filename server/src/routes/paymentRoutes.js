import { Router } from "express";
import { init, verify, webhook } from "../controllers/paymentController.js"
import { verifyPaystackWebhook } from "../middlewares/paymentMiddleware.js"
import { requireVerified, protect } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * PATH: /api/payments/initialize
 * 1. protect: Checks JWT/Session
 * 2. verifyEmail: Checks if user.isVerified === true
 * 3. init: The logic
 */
router.post("/initialize", protect, requireVerified, init);

/**
 * PATH: /api/payments/verify
 * Note: Usually protected so users can only verify their own sessions
 */
router.get("/verify", protect, verify);

/**
 * PATH: /api/payments/webhook
 * 
 */
router.post("/webhook", verifyPaystackWebhook, webhook);

export default router;