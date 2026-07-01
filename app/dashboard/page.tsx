import { auth } from "@/auth";
import { getSafeCallbackPath } from "@/app/lib/auth-redirect";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(getSafeCallbackPath("/dashboard"))}`,
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-4 text-lg text-foreground-muted">
        Signed in as{" "}
        {session.user.name || session.user.email || "your Google account"}.
      </p>
    </section>
  );
}
