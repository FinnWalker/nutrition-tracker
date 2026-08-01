import Link from "next/link";

export default function FoodLibraryPage() {
  return (
    <main className="min-h-dvh px-6 py-10 md:px-10 md:py-14">
      <section className="mx-auto w-full max-w-5xl border border-dashed border-border bg-surface p-8 md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
          Rebuild mode
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Food Library
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">
          This route is intentionally cleared so we can redesign saved foods
          from scratch. The previous experience remains available at{" "}
          <Link href="/legacy/food-library" className="underline">
            /legacy/food-library
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
