import donationService from "../services/donationService.js";

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
        logger.info('Webhook processing failed:', error.message);
    }
}