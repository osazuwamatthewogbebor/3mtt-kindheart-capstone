import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL ?? process.env.DATABASE_UR;

if (!databaseUrl) {
  throw new Error(
    "Missing required environment variable: DATABASE_URL (or legacy DATABASE_UR)",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
