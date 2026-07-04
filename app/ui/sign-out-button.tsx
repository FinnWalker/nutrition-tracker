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
      className={`flex items-center gap-3 border border-border px-4 py-2 text-sm text-foreground-muted ${className}`.trim()}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {iconOnly ? null : <span>Sign out</span>}
    </button>
  );
}
