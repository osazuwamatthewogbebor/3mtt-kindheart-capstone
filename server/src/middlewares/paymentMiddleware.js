import crypto from "crypto";
import { PAYSTACK_SECRET } from "../config/paystack.js";

export const verifyPaystackWebhook = (req, res, next) => {
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (hash === req.headers["x-paystack-signature"]) {
        next();
    } else {
        res.status(401).json({message: "Invalid Webhook Signature"});
    }
};