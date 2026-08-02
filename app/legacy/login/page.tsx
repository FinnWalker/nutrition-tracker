import { Suspense } from "react";
import { auth } from "@/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getSafeCallbackPath,
} from "@/app/lib/auth-redirect";
import LoginPanel from "@/app/ui/login-panel";
import PageContainer from "@/app/ui/page-container";
import { redirect } from "next/navigation";

type LegacyLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function LegacyLoginPage(props: LegacyLoginPageProps) {
  return (
    <PageContainer width="narrow" className="flex min-h-full items-center py-4">
      <Suspense fallback={<LegacyLoginPageFallback />}>
        <LegacyLoginPageContent searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}

async function LegacyLoginPageContent({ searchParams }: LegacyLoginPageProps) {
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

function LegacyLoginPageFallback() {
  return (
    <section className="w-full border border-border bg-surface p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
        Sign in
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Connect your Google account
      </h1>
      <p className="mt-3 text-base leading-7 text-foreground-muted">
        Preparing your sign-in flow...
      </p>
      <div className="mt-6 h-10 w-44 bg-surface-elevated" aria-hidden="true" />
    </section>
  );
}
