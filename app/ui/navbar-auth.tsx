import Image from "next/image";
import { getCurrentUserProfile } from "@/app/lib/get-current-user-profile";
import GoogleSignInButton from "./google-sign-in-button";
import SignOutButton from "./sign-out-button";

export default async function NavbarAuth() {
  const user = await getCurrentUserProfile();

  if (!user) {
    return (
      <GoogleSignInButton
        label="Sign in with Google"
        className="w-full cursor-pointer rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      />
    );
  }

  const displayName = user.name || user.email || "Signed in";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-3 py-3 shadow-soft">
        {user.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-muted text-sm font-semibold text-brand-foreground">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </p>
          {user.email ? (
            <p className="truncate text-xs text-foreground-muted">
              {user.email}
            </p>
          ) : null}
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
