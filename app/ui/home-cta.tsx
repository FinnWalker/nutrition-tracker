"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import GoogleSignInButton from "./google-sign-in-button";

export default function HomeCta() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        aria-hidden="true"
        className="mt-8 h-12 w-48 rounded-2xl border border-border bg-surface-elevated shadow-soft"
      />
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {session?.user ? (
        <Link
          href="/dashboard"
          className="rounded-2xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
        >
          Open dashboard
        </Link>
      ) : (
        <GoogleSignInButton
          label="Continue with Google"
          className="cursor-pointer rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        />
      )}
    </div>
  );
}
