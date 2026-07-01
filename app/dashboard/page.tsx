import { Suspense } from "react";
import { auth } from "@/auth";
import { getSafeCallbackPath } from "@/app/lib/auth-redirect";
import { getCachedUserRecord } from "@/app/lib/get-cached-user-record";
import { redirect } from "next/navigation";

export const unstable_instant = false;

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
      <Suspense fallback={<DashboardContentFallback />}>
        <DashboardContent />
      </Suspense>
    </section>
  );
}

export async function DashboardContent() {
  const session = await auth();

  if (!session?.user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(getSafeCallbackPath("/dashboard"))}`,
    );
  }

  const dbUser = session.user.email
    ? await getCachedUserRecord(session.user.email)
    : null;

  return (
    <>
      <p className="mt-4 text-lg text-foreground-muted">
        Signed in as{" "}
        {session.user.name || session.user.email || "your Google account"}.
      </p>
      <div className="mt-8 rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
          Database user ID
        </p>
        <p className="mt-3 font-mono text-lg text-foreground">
          {dbUser?.id ?? "No database record found"}
        </p>
      </div>
    </>
  );
}

function DashboardContentFallback() {
  return (
    <>
      <p className="mt-4 text-lg text-foreground-muted">
        Loading your dashboard...
      </p>
      <div className="mt-8 rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
          Database user ID
        </p>
        <div
          className="mt-3 h-7 w-56 rounded-full bg-surface"
          aria-hidden="true"
        />
      </div>
    </>
  );
}
