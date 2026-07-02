import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/prisma";

export async function getCachedDailyEntries(email: string) {
  "use cache";

  cacheLife("minutes");
  cacheTag(`daily-entries:${email}`);

  return prisma.dailyEntry.findMany({
    where: {
      user: {
        email,
      },
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      entryDate: true,
      foodName: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
    },
  });
}
