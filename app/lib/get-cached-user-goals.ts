import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/prisma";

function getUserGoalsTag(email: string) {
  return `user-goals:${email}`;
}

export async function getCachedUserGoals(email: string) {
  "use cache";

  cacheLife("minutes");
  cacheTag(getUserGoalsTag(email));

  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      dailyCalorieGoal: true,
      dailyProteinGoal: true,
      dailyCarbsGoal: true,
      dailyFatGoal: true,
    },
  });
}
