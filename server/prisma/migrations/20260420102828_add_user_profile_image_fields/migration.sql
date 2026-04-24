/*
  Warnings:

  - You are about to drop the `Campaign` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImagePublicId" TEXT,
ADD COLUMN     "profileImageUrl" TEXT;

-- DropTable
DROP TABLE "Campaign";
