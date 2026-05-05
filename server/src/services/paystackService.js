import { PAYSTACK_URLS, paystackHeaders} from "../config/paystack.js";
import { PaymentGateway } from "./interfaces/paymentGateway.js";


export class PaystackService extends PaymentGateway {
    
    // Initiate transaction method
    async initializePayment(email, amount,metadata) {
        const response = await fetch(PAYSTACK_URLS.INITIALIZE, {
            method: "POST",
            headers: paystackHeaders,
            body: JSON.stringify({
                email,
                amount: amount * 100,
                metadata,
                callback_url: "http://localhost:3000/api/donations/verify-payment",
            })
        });

        const result = await response.json();
        if (!result.status) throw new Error(result.message);

        return result.data;
    }
    
    // Verify transaction method using reference id
    async verifyPayment(reference) {
        const response = await fetch(`${PAYSTACK_URLS.VERIFY}/${reference}`, {
            method: "GET",
            headers: paystackHeaders,
        })

        const result = await response.json();
        return result.data;
    }
}

