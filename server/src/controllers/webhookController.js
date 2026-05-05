import donationService from "../services/donationService.js";
import prisma from "../config/db.js";
import logger from "../config/logger.js";

export const donationPaystackWebHook = async (req, res) => {
    res.status(200).send("OK");

    try {
        const {event, data} = req.body

        if (event === "charge.success") {
            await donationService.finalizeDonation(data.reference);
            logger.info(`Payment successful for reference: ${data.reference}`)
        } else if (event === "charge.failed") {
            await prisma.donation.update({
                where: { reference: data.reference },
                data: { status: "FAILED" }
            })
        }
    } catch (error) {
        logger.error(`Webhook processing failed: ${error.message}`);
    }
}