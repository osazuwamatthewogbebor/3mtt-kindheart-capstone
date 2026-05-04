import crypto from "crypto";
import { PAYSTACK_SECRET } from "../config/paystack.js";

export const verifyPaystackWebhook = (req, res, next) => {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(rawBody)
        .digest("hex");

    if (hash === req.headers["x-paystack-signature"]) {
        next();
    } else {
        res.status(401).json({message: "Invalid Webhook Signature"});
    }
};