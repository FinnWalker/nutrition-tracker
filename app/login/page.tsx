import { Suspense } from "react";
import { auth } from "@/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getSafeCallbackPath,
} from "@/app/lib/auth-redirect";
import LoginPanel from "@/app/ui/login-panel";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function LoginPage(props: LoginPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-12 md:px-10">
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

  return <LoginPanel callbackUrl={callbackUrl} />;
}

function LoginPageFallback() {
  return (
    <section className="w-full rounded-[2rem] border border-border bg-surface/90 p-8 shadow-soft md:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-foreground-muted">
        Sign in
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Connect your Google account
      </h1>
      <p className="mt-4 text-lg leading-8 text-foreground-muted">
        Preparing your sign-in flow...
      </p>
      <div
        className="mt-8 h-12 w-48 rounded-2xl bg-surface"
        aria-hidden="true"
      />
    </section>
  );
}
