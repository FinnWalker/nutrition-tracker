ALTER TABLE "PantryItem" RENAME TO "SavedFood";

ALTER INDEX "PantryItem_pkey" RENAME TO "SavedFood_pkey";
ALTER INDEX "PantryItem_userId_name_idx" RENAME TO "SavedFood_userId_name_idx";
ALTER INDEX "PantryItem_userId_updatedAt_idx" RENAME TO "SavedFood_userId_updatedAt_idx";
ALTER INDEX "PantryItem_userId_lastUsedAt_idx" RENAME TO "SavedFood_userId_lastUsedAt_idx";
ALTER TABLE "SavedFood" RENAME CONSTRAINT "PantryItem_userId_fkey" TO "SavedFood_userId_fkey";
