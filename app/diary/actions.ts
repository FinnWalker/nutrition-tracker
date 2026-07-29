"use server";

import { updateTag } from "next/cache";
import { requireCurrentUserRecord } from "@/app/lib/require-current-user-record";
import { prisma } from "@/prisma";

type DailyEntryInput = {
  entryDate: string;
  foodName: string;
  servings: number;
  savedFoodId?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function revalidateDailyEntries(email: string) {
  updateTag(`daily-entries:${email}`);
}

function revalidateSavedFoods(email: string) {
  updateTag(`saved-foods:${email}`);
}

export async function addDailyEntry(input: DailyEntryInput) {
  const user = await requireCurrentUserRecord();

  const createdEntry = await prisma.dailyEntry.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },
      entryDate: new Date(`${input.entryDate}T00:00:00.000Z`),
      foodName: input.foodName.trim(),
      servings: Math.max(0.1, input.servings),
      calories: Math.max(0, Math.round(input.calories)),
      protein: Math.max(0, input.protein),
      carbs: Math.max(0, input.carbs),
      fat: Math.max(0, input.fat),
    },
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

  if (input.savedFoodId) {
    await prisma.savedFood.updateMany({
      where: {
        id: input.savedFoodId,
        user: {
          id: user.id,
        },
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
    revalidateSavedFoods(user.email);
  }

  revalidateDailyEntries(user.email);

  return createdEntry;
}

export async function deleteDailyEntry(entryId: string) {
  const user = await requireCurrentUserRecord();

  await prisma.dailyEntry.deleteMany({
    where: {
      id: entryId,
      user: {
        id: user.id,
      },
    },
  });

  revalidateDailyEntries(user.email);
}

export async function clearDailyEntries() {
  const user = await requireCurrentUserRecord();

  await prisma.dailyEntry.deleteMany({
    where: {
      user: {
        id: user.id,
      },
    },
  });

  revalidateDailyEntries(user.email);
}
