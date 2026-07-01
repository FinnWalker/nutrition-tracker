import { auth } from "@/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getSafeCallbackPath,
} from "@/app/lib/auth-redirect";
import LoginPanel from "@/app/ui/login-panel";
import { redirect } from "next/navigation";

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  const query = await props.searchParams;
  const callbackUrl = getSafeCallbackPath(
    query.callbackUrl,
    DEFAULT_AUTH_REDIRECT,
  );

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-12 md:px-10">
      <LoginPanel callbackUrl={callbackUrl} />
    </main>
  );
}
