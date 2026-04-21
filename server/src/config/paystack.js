import dotenv from "dotenv";
dotenv.config()

export const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
export const PAYSTACK_URLS = {
    INITIALIZE: "https://api.paystack.co/transaction/initialize",
    VERIFY: "https://api.paystack.co/transaction/verify",
};

export const paystackHeaders = {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
};

