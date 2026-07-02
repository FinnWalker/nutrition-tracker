import { cache } from "react";
import { auth } from "@/auth";

export type CurrentUserProfile = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export const getCurrentUserProfile = cache(async () => {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return null;
  }

  return {
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  } satisfies CurrentUserProfile;
});
