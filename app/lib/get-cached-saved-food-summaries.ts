import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/prisma";

export async function getCachedSavedFoodSummaries(email: string) {
  "use cache";

  cacheLife("minutes");
  cacheTag(`saved-foods:${email}`);

  return prisma.savedFood.findMany({
    where: {
      user: {
        email,
      },
    },
    orderBy: [
      { lastUsedAt: { sort: "desc", nulls: "last" } },
      { updatedAt: "desc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      brand: true,
      servingSize: true,
      lastUsedAt: true,
    },
  });
}
