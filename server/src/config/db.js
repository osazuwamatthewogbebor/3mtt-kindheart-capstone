import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';


const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_UR;

if (!connectionString) {
	throw new Error('Missing required environment variable: DATABASE_URL');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});


export default prisma;
