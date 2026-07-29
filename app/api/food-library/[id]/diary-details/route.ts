import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserRecord } from "@/app/lib/require-current-user-record";
import { prisma } from "@/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await requireCurrentUserRecord();
  const { id } = await context.params;

  const savedFood = await prisma.savedFood.findFirst({
    where: {
      id,
      user: {
        id: user.id,
      },
    },
    select: {
      id: true,
      calories: true,
      totalFat: true,
      totalCarbohydrate: true,
      protein: true,
    },
  });

  if (!savedFood) {
    return NextResponse.json(
      { error: "Saved food not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(savedFood);
}
