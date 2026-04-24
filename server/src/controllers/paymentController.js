import logger from "../config/logger.js";
import * as PaymentService from "../services/paystackService.js"
import { amountSchema } from "../validations/paymentValidator.js";


export const init = async (req, res) => {
    try {
        const { amount } = req.body;
        const validatedAmount = paymentSchema.parse(amount)      
        
        const email = req.user.email
        const userId = req.user.UserId

        const data = await PaymentService.initializeTx(
            email, 
            validatedAmount,
            {userId},
        );

        res.status(200).json(data);
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({error: error.message})
    }
};


export const verify = async (req, res) => {
    try {
        const { reference } = req.query;
        const result = await PaymentService.verifyPayment(reference);

        if (result.data.status === "success") {
            return res.status(200).json({status: "success", data: result.data });
        }
        res.status(400).json({status: "failed" });
    } catch (error) {
        res.status(500).json({error: error.message })
    }
}

// Webhook
export const webhook = async (req, res) => {
    res.sendStatus(200);

    const {event, data} = req.body
    if (event === "charge.success") {
        logger.info(`Webhook received for ref: ${data.reference}`)
    }
}
