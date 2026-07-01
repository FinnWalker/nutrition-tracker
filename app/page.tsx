import HomeCta from "./ui/home-cta";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-12 md:px-10">
      <section className="w-full rounded-[2rem] border border-border bg-surface/90 p-8 shadow-soft md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-foreground-muted">
          Wellness
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          Nutrition Tracker
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-foreground-muted">
          Track your meals, keep an eye on macros, and keep your nutrition data
          in one place.
        </p>
        <HomeCta />
      </section>
    </main>
  );
}
