import cron from "node-cron";
import prisma from "../config/db.js";
import logger from "../config/logger.js"

// Clean up expired sessions from Neon Database
// Runs every day at midnight

const setupSessionCleanup = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            logger.info("Starting expired session cleanup...");

            const result = await prisma.session.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    },
                },
            });

            logger.info(`Cleanup successful.Deleted ${result.count} expired sessions.`)
        } catch (error) {
            logger.error(`Session cleanup failed: ${error.message}`)
        }
    })
}

export const initCronJobs = () => {
    setupSessionCleanup();
    logger.info("Cron jobs initialised")
}