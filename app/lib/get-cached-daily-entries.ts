import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/prisma";

function getDailyEntriesTag(email: string, entryDate: string) {
  return `daily-entries:${email}:${entryDate}`;
}

export async function getCachedDailyEntries(email: string, entryDate: string) {
  "use cache";

  cacheLife("minutes");
  cacheTag(getDailyEntriesTag(email, entryDate));

  return prisma.dailyEntry.findMany({
    where: {
      entryDate: new Date(`${entryDate}T00:00:00.000Z`),
      user: {
        email,
      },
    },
    orderBy: [{ consumedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      entryDate: true,
      consumedAt: true,
      createdAt: true,
      mealCategory: true,
      foodName: true,
      servings: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
    },
  });
}
