import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh px-6 py-10 md:px-10 md:py-14">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-5xl items-center border border-dashed border-border bg-surface p-8 md:p-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
            Rebuild mode
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
            Blank canvas
          </h1>
          <p className="mt-4 text-base leading-7 text-foreground-muted">
            The active routes are now reset for a fresh UI rebuild. The previous
            interface is preserved at{" "}
            <Link href="/legacy" className="underline">
              /legacy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
