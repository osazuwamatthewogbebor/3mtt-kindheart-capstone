-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "campaignStatus" "CampaignStatus" NOT NULL DEFAULT 'PENDING';
