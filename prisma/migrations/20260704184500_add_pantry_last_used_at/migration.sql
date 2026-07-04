ALTER TABLE "PantryItem"
ADD COLUMN "lastUsedAt" TIMESTAMP(3);

CREATE INDEX "PantryItem_userId_lastUsedAt_idx"
ON "PantryItem"("userId", "lastUsedAt");
