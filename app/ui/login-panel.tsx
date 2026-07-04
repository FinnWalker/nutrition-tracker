import { signIn } from "@/auth";

type LoginPanelProps = {
  callbackUrl: string;
};

export default function LoginPanel({ callbackUrl }: LoginPanelProps) {
  return (
    <section className="w-full border border-border bg-surface p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
        Sign in
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Connect your Google account
      </h1>
      <p className="mt-3 text-base leading-7 text-foreground-muted">
        Use Google to unlock your private nutrition dashboard.
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
