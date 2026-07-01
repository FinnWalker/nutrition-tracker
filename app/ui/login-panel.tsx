import { signIn } from "@/auth";

type LoginPanelProps = {
  callbackUrl: string;
};

export default function LoginPanel({ callbackUrl }: LoginPanelProps) {
  return (
    <section className="w-full rounded-[2rem] border border-border bg-surface/90 p-8 shadow-soft md:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-foreground-muted">
        Sign in
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Connect your Google account
      </h1>
      <p className="mt-4 text-lg leading-8 text-foreground-muted">
        Use Google to unlock your private nutrition dashboard.
      </p>

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl });
        }}
      >
        <button
          type="submit"
          className="cursor-pointer rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Continue with Google
        </button>
      </form>
    </section>
  );
}
