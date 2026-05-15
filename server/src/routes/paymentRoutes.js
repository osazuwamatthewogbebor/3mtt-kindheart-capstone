import express, { Router } from "express";
import { verifyPaystackWebhook } from "../middlewares/paymentMiddleware.js"
import { donationPaystackWebHook } from "../controllers/webhookController.js";

const router = Router();

/**
 * PATH: /api/payments/webhook
 * 
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json", limit: "100kb" }),
  verifyPaystackWebhook,
  donationPaystackWebHook,
);

export default router;
