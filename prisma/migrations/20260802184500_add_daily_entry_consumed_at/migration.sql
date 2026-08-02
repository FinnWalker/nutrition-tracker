ALTER TABLE "DailyEntry"
ADD COLUMN "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "DailyEntry_userId_entryDate_consumedAt_idx"
ON "DailyEntry"("userId", "entryDate", "consumedAt");
