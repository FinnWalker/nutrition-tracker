import { auth } from "@/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getSafeCallbackPath,
} from "@/app/lib/auth-redirect";
import Modal from "@/app/ui/modal";
import LoginPanel from "@/app/ui/login-panel";
import { redirect } from "next/navigation";

type InterceptedLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InterceptedLoginPage(
  props: InterceptedLoginPageProps,
) {
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
    <Modal>
      <LoginPanel callbackUrl={callbackUrl} />
    </Modal>
  );
}
