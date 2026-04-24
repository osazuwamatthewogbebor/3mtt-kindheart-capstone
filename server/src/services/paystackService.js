import { PAYSTACK_URLS, paystackHeaders} from "../config/paystack.js";

// Initiate transaction
export const initializeTx = async (email, amount, metadata = {}) => {
    const response = await fetch(PAYSTACK_URLS.INITIALIZE, {
        method: "POST",
        headers: paystackHeaders,
        body: JSON.stringify({
            email,
            amount: amount * 100, 
            metadata,
            callback_url: "http://localhost:3000/verify-payment",
        }),
    });
    return await response.json();
};

// Verify transaction using reference id
export const verifyPayment = async (reference) => {
    const response = await fetch(`${PAYSTACK_URLS.VERIFY}${reference}`, {
        method: "GET", 
        headers: paystackHeaders,
    });
    return await response.json();
}