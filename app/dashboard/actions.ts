"use server";

import { updateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

type DailyEntryInput = {
  entryDate: string;
  foodName: string;
  servings: number;
  pantryItemId?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

async function requireSignedInUserEmail() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    throw new Error("You must be signed in to save diary entries.");
  }

  return email;
}

function revalidateDailyEntries(email: string) {
  updateTag(`daily-entries:${email}`);
}

function revalidatePantryItems(email: string) {
  updateTag(`pantry-items:${email}`);
}

export async function addDailyEntry(input: DailyEntryInput) {
  const email = await requireSignedInUserEmail();

  const createdEntry = await prisma.dailyEntry.create({
    data: {
      user: {
        connect: {
          email,
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

  if (input.pantryItemId) {
    await prisma.pantryItem.updateMany({
      where: {
        id: input.pantryItemId,
        user: {
          email,
        },
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
    revalidatePantryItems(email);
  }

  revalidateDailyEntries(email);

  return createdEntry;
}

export async function deleteDailyEntry(entryId: string) {
  const email = await requireSignedInUserEmail();

  await prisma.dailyEntry.deleteMany({
    where: {
      id: entryId,
      user: {
        email,
      },
    },
  });

  revalidateDailyEntries(email);
}

export async function clearDailyEntries() {
  const email = await requireSignedInUserEmail();

  await prisma.dailyEntry.deleteMany({
    where: {
      user: {
        email,
      },
    },
  });

  revalidateDailyEntries(email);
}
