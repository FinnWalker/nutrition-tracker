import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/prisma";

export async function getCachedPantryItems(email: string) {
  "use cache";

  cacheLife("minutes");
  cacheTag(`pantry-items:${email}`);

  return prisma.pantryItem.findMany({
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
      servingsPerContainer: true,
      lastUsedAt: true,
      calories: true,
      totalFat: true,
      saturatedFat: true,
      transFat: true,
      polyunsaturatedFat: true,
      monounsaturatedFat: true,
      cholesterolMg: true,
      sodiumMg: true,
      totalCarbohydrate: true,
      dietaryFiber: true,
      totalSugars: true,
      addedSugars: true,
      protein: true,
      vitaminDMcg: true,
      calciumMg: true,
      ironMg: true,
      potassiumMg: true,
      updatedAt: true,
    },
  });
}
