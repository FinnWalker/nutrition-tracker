"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import GoogleSignInButton from "./google-sign-in-button";

export default function NavbarAuth() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const user = session?.user ?? null;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  if (status === "loading") {
    return (
      <div
        aria-hidden="true"
        className="flex items-center gap-3 rounded-[1.45rem] border border-border bg-white px-3.5 py-3 shadow-sm"
      >
        <div className="h-11 w-11 shrink-0 rounded-full bg-surface-elevated" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-16 rounded-full bg-surface-elevated" />
          <div className="h-3 w-14 rounded-full bg-surface-elevated" />
        </div>
        <div className="h-9 w-9 shrink-0 rounded-xl border border-border bg-surface-elevated" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[4.5rem] items-center">
        <GoogleSignInButton
          label="Sign in with Google"
          className="flex w-full items-center justify-center gap-3 rounded-[1.45rem] border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface"
        />
      </div>
    );
  }

  const displayName = user.name || user.email || "Signed in";
  const secondaryLabel = "Personal plan";

  return (
    <div
      ref={menuRef}
      className="relative flex items-center gap-3 rounded-[1.45rem] border border-border bg-white px-3.5 py-3 shadow-sm"
    >
      <div className="shrink-0">
        {user.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={48}
            height={48}
            className="h-11 w-11 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-muted text-sm font-semibold text-brand-foreground">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {displayName}
        </p>
        <p className="truncate text-xs font-medium text-foreground-muted">
          {secondaryLabel}
        </p>
      </div>

      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-surface"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isMenuOpen ? (
        <div
          role="menu"
          aria-label="Account actions"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 z-20 w-56 rounded-[1.2rem] border border-border bg-white p-2 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            {user.email ? (
              <p className="truncate text-xs text-foreground-muted">
                {user.email}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
