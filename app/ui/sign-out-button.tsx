"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  className?: string;
  iconOnly?: boolean;
};

export default function SignOutButton({
  className = "",
  iconOnly = false,
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      aria-label="Sign out"
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground ${className}`.trim()}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {iconOnly ? null : <span>Sign out</span>}
    </button>
  );
}
