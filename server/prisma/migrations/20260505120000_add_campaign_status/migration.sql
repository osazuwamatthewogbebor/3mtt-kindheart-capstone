-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "campaignStatus" "CampaignStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill existing campaigns so they remain visible after introducing live status filtering
UPDATE "Campaign"
SET "campaignStatus" = 'APPROVED'
WHERE "campaignStatus" = 'PENDING';
