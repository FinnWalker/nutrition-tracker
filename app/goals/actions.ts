"use server";

import { updateTag } from "next/cache";
import { requireCurrentUserRecord } from "@/app/lib/require-current-user-record";
import { prisma } from "@/prisma";

type UserGoalsInput = {
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbsGoal: number;
  dailyFatGoal: number;
};

function revalidateUserGoals(email: string) {
  updateTag(`user-goals:${email}`);
}

export async function updateUserGoals(input: UserGoalsInput) {
  const user = await requireCurrentUserRecord();

  const updatedUserGoals = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      dailyCalorieGoal: Math.max(0, Math.round(input.dailyCalorieGoal)),
      dailyProteinGoal: Math.max(0, input.dailyProteinGoal),
      dailyCarbsGoal: Math.max(0, input.dailyCarbsGoal),
      dailyFatGoal: Math.max(0, input.dailyFatGoal),
    },
    select: {
      dailyCalorieGoal: true,
      dailyProteinGoal: true,
      dailyCarbsGoal: true,
      dailyFatGoal: true,
    },
  });

  revalidateUserGoals(user.email);

  return updatedUserGoals;
}
