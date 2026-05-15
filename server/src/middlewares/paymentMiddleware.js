import crypto from "crypto";
import { PAYSTACK_SECRET } from "../config/paystack.js";

export const verifyPaystackWebhook = (req, res, next) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(rawBody)
        .digest("hex");

    if (hash === req.headers["x-paystack-signature"]) {
        try {
            req.verifiedWebhookBody = JSON.parse(rawBody.toString("utf8"));
        } catch (error) {
            return res.status(400).json({ message: "Invalid webhook payload" });
        }
        next();
    } else {
        res.status(401).json({message: "Invalid Webhook Signature"});
    }
};
