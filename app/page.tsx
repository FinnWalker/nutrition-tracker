import HomeCta from "./ui/home-cta";
import PageContainer from "./ui/page-container";

export default function Home() {
  return (
    <PageContainer className="flex flex-1 items-center">
      <section className="w-full border border-border bg-surface p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
          Wellness
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Nutrition Tracker
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-foreground-muted">
          Track your meals, keep an eye on macros, and keep your nutrition data
          in one place.
        </p>
        <HomeCta />
      </section>
    </PageContainer>
  );
}
