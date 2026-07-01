import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/prisma";

export async function getCachedUserRecord(email: string) {
  "use cache";

  cacheLife("hours");
  cacheTag(`user:${email}`);

  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}
