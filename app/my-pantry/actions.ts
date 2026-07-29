"use server";

import { updateTag } from "next/cache";
import { requireCurrentUserRecord } from "@/app/lib/require-current-user-record";
import { prisma } from "@/prisma";

type PantryItemInput = {
  name: string;
  brand?: string;
  servingSize?: string;
  servingsPerContainer?: number;
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  polyunsaturatedFat: number;
  monounsaturatedFat: number;
  cholesterolMg: number;
  sodiumMg: number;
  totalCarbohydrate: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars: number;
  protein: number;
  vitaminDMcg: number;
  calciumMg: number;
  ironMg: number;
  potassiumMg: number;
};

function revalidatePantryItems(email: string) {
  updateTag(`pantry-items:${email}`);
}

export async function addPantryItem(input: PantryItemInput) {
  const user = await requireCurrentUserRecord();
  const name = input.name.trim();
  const brand = input.brand?.trim() ?? "";
  const servingSize = input.servingSize?.trim() ?? "";

  if (!name) {
    throw new Error("Food name is required.");
  }

  const createdItem = await prisma.pantryItem.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },
      name,
      brand: brand || null,
      servingSize: servingSize || null,
      servingsPerContainer:
        typeof input.servingsPerContainer === "number" &&
        Number.isFinite(input.servingsPerContainer)
          ? Math.max(0, input.servingsPerContainer)
          : null,
      calories: Math.max(0, input.calories),
      totalFat: Math.max(0, input.totalFat),
      saturatedFat: Math.max(0, input.saturatedFat),
      transFat: Math.max(0, input.transFat),
      polyunsaturatedFat: Math.max(0, input.polyunsaturatedFat),
      monounsaturatedFat: Math.max(0, input.monounsaturatedFat),
      cholesterolMg: Math.max(0, input.cholesterolMg),
      sodiumMg: Math.max(0, input.sodiumMg),
      totalCarbohydrate: Math.max(0, input.totalCarbohydrate),
      dietaryFiber: Math.max(0, input.dietaryFiber),
      totalSugars: Math.max(0, input.totalSugars),
      addedSugars: Math.max(0, input.addedSugars),
      protein: Math.max(0, input.protein),
      vitaminDMcg: Math.max(0, input.vitaminDMcg),
      calciumMg: Math.max(0, input.calciumMg),
      ironMg: Math.max(0, input.ironMg),
      potassiumMg: Math.max(0, input.potassiumMg),
    },
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

  revalidatePantryItems(user.email);

  return createdItem;
}

export async function updatePantryItem(itemId: string, input: PantryItemInput) {
  const user = await requireCurrentUserRecord();
  const name = input.name.trim();
  const brand = input.brand?.trim() ?? "";
  const servingSize = input.servingSize?.trim() ?? "";

  if (!name) {
    throw new Error("Food name is required.");
  }

  const updatedItem = await prisma.pantryItem.updateManyAndReturn({
    where: {
      id: itemId,
      user: {
        id: user.id,
      },
    },
    data: {
      name,
      brand: brand || null,
      servingSize: servingSize || null,
      servingsPerContainer:
        typeof input.servingsPerContainer === "number" &&
        Number.isFinite(input.servingsPerContainer)
          ? Math.max(0, input.servingsPerContainer)
          : null,
      calories: Math.max(0, input.calories),
      totalFat: Math.max(0, input.totalFat),
      saturatedFat: Math.max(0, input.saturatedFat),
      transFat: Math.max(0, input.transFat),
      polyunsaturatedFat: Math.max(0, input.polyunsaturatedFat),
      monounsaturatedFat: Math.max(0, input.monounsaturatedFat),
      cholesterolMg: Math.max(0, input.cholesterolMg),
      sodiumMg: Math.max(0, input.sodiumMg),
      totalCarbohydrate: Math.max(0, input.totalCarbohydrate),
      dietaryFiber: Math.max(0, input.dietaryFiber),
      totalSugars: Math.max(0, input.totalSugars),
      addedSugars: Math.max(0, input.addedSugars),
      protein: Math.max(0, input.protein),
      vitaminDMcg: Math.max(0, input.vitaminDMcg),
      calciumMg: Math.max(0, input.calciumMg),
      ironMg: Math.max(0, input.ironMg),
      potassiumMg: Math.max(0, input.potassiumMg),
    },
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

  revalidatePantryItems(user.email);

  return updatedItem[0] ?? null;
}

export async function deletePantryItem(itemId: string) {
  const user = await requireCurrentUserRecord();

  await prisma.pantryItem.deleteMany({
    where: {
      id: itemId,
      user: {
        id: user.id,
      },
    },
  });

  revalidatePantryItems(user.email);
}
