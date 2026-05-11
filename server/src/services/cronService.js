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

// Keep Render instance Awake
// Runs every 14 minutes
const setupKeepAwake = () => {
    const APP_URL = process.env.APP_URL || "http://localhost:3000";

    cron.schedule("*/14 * * * *", async () => {
        try {
            logger.info("Pinging server to keep awake...")
            await fetch(`${APP_URL}/api/health`)
            logger.info("Ping successful.")
        } catch (error) {
            logger.error("Keep-awake ping failed")
        }
    });
};

export const initCronJobs = () => {
    setupSessionCleanup();
    setupKeepAwake();
    logger.info("Cron jobs initialised")
}