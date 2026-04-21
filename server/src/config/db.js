import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg'

dotenv.config({ path: "../.env"});

const { Pool } = pkg;


const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('Missing required environment variable: DATABASE_URL');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter: adapter,
    log: ["query", "info", "warn", "error"],
});


export default prisma;
