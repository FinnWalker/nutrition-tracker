import { cache } from "react";
import { getCurrentSession } from "./get-current-session";

export type CurrentUserProfile = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export const getCurrentUserProfile = cache(async () => {
  const session = await getCurrentSession();
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
