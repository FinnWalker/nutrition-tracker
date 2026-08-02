"use server";

import { updateTag } from "next/cache";
import { getDefaultConsumedAt } from "@/app/lib/diary-consumed-at";
import { requireCurrentUserRecord } from "@/app/lib/require-current-user-record";
import { prisma } from "@/prisma";

type DailyEntryInput = {
  entryDate: string;
  consumedAt?: string | null;
  foodName: string;
  servings: number;
  savedFoodId?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function revalidateDailyEntries(email: string, entryDate: string) {
  updateTag(`daily-entries:${email}:${entryDate}`);
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
      consumedAt:
        input.consumedAt === null
          ? null
          : input.consumedAt
            ? new Date(input.consumedAt)
            : getDefaultConsumedAt(input.entryDate),
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
      consumedAt: true,
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

  revalidateDailyEntries(user.email, input.entryDate);

  return createdEntry;
}

export async function updateDailyEntryTime(
  entryId: string,
  input: {
    entryDate: string;
    consumedAt: string | null;
  },
) {
  const user = await requireCurrentUserRecord();

  await prisma.dailyEntry.updateMany({
    where: {
      id: entryId,
      user: {
        id: user.id,
      },
    },
    data: {
      consumedAt: input.consumedAt ? new Date(input.consumedAt) : null,
    },
  });

  revalidateDailyEntries(user.email, input.entryDate);
}

export async function deleteDailyEntry(entryId: string) {
  const user = await requireCurrentUserRecord();

  const entry = await prisma.dailyEntry.findFirst({
    where: {
      id: entryId,
      user: {
        id: user.id,
      },
    },
    select: {
      entryDate: true,
    },
  });

  await prisma.dailyEntry.deleteMany({
    where: {
      id: entryId,
      user: {
        id: user.id,
      },
    },
  });

  if (entry) {
    revalidateDailyEntries(
      user.email,
      entry.entryDate.toISOString().slice(0, 10),
    );
  }
}

export async function clearDailyEntries(entryDate: string) {
  const user = await requireCurrentUserRecord();

  await prisma.dailyEntry.deleteMany({
    where: {
      entryDate: new Date(`${entryDate}T00:00:00.000Z`),
      user: {
        id: user.id,
      },
    },
  });

  revalidateDailyEntries(user.email, entryDate);
}
