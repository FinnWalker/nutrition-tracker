"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import GoogleSignInButton from "./google-sign-in-button";

export default function NavbarAuth() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const displayName = user?.name || user?.email || "Signed in";

  if (status === "loading") {
    return (
      <div
        aria-hidden="true"
        className="h-[4.5rem] rounded-2xl border border-border bg-surface-elevated shadow-soft"
      />
    );
  }

  if (!user) {
    return (
      <GoogleSignInButton
        label="Sign in with Google"
        className="w-full cursor-pointer rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      />
    );
  }

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
            <p className="truncate text-xs text-foreground-muted">{user.email}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
