import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Took out the adapter, it was causing some mismathc errors
const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});

export default prisma;
