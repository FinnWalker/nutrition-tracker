import { Suspense } from "react";
import Link from "next/link";
import { auth, signIn } from "@/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getSafeCallbackPath,
} from "@/app/lib/auth-redirect";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function LoginPage(props: LoginPageProps) {
  return (
    <main className="min-h-dvh px-6 py-10 md:px-10 md:py-14">
      <Suspense fallback={<LoginPageFallback />}>
        <LoginPageContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  const session = await auth();
  const query = await searchParams;
  const callbackUrl = getSafeCallbackPath(
    query.callbackUrl,
    DEFAULT_AUTH_REDIRECT,
  );

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <section className="mx-auto w-full max-w-xl border border-dashed border-border bg-surface p-8 md:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
        Rebuild mode
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-4 text-base leading-7 text-foreground-muted">
        This page has been reduced to a minimal flow while the new UI is rebuilt.
        The previous sign-in screen still lives at{" "}
        <Link href="/legacy/login" className="underline">
          /legacy/login
        </Link>
        .
      </p>

      <form
        className="mt-6"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl });
        }}
      >
        <button type="submit" className="bg-brand px-4 py-2 text-sm text-white">
          Continue with Google
        </button>
      </form>
    </section>
  );
}

function LoginPageFallback() {
  return (
    <section className="mx-auto w-full max-w-xl border border-dashed border-border bg-surface p-8 md:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
        Rebuild mode
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-3 text-base leading-7 text-foreground-muted">
        Preparing your sign-in flow...
      </p>
      <div className="mt-6 h-10 w-44 bg-surface-elevated" aria-hidden="true" />
    </section>
  );
}
