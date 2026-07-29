import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function requireCurrentUserRecord() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  const name = session?.user?.name ?? null;
  const image = session?.user?.image ?? null;

  if (!email) {
    throw new Error("You must be signed in to continue.");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      image,
    },
    create: {
      email,
      name,
      image,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return user;
}
