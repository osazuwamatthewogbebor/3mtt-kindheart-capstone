-- Drop existing Campaign table to recreate with new schema
DROP TABLE IF EXISTS "Campaign" CASCADE;

-- Recreate Campaign table with new structure
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "goalAmount" DOUBLE PRECISION NOT NULL,
    "amountRaised" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");
CREATE INDEX "Campaign_categoryId_idx" ON "Campaign"("categoryId");
CREATE INDEX "Campaign_startDate_idx" ON "Campaign"("startDate");
CREATE INDEX "Campaign_endDate_idx" ON "Campaign"("endDate");
