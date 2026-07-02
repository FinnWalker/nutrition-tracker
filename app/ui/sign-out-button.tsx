"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>Sign out</span>
    </button>
  );
}
