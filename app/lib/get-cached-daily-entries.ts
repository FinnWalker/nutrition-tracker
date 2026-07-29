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
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      entryDate: true,
      foodName: true,
      servings: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
    },
  });
}
