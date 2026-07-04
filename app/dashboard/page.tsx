import { Suspense } from "react";
import DashboardDiary from "@/app/ui/dashboard-diary";
import DashboardDiarySection from "./dashboard-diary-section";

export const unstable_instant = false;

export default function DashboardPage() {
  return (
    <section className="w-full">
      <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-4 text-lg text-foreground-muted">
        Review your daily totals, then pull foods straight from your pantry
        into the diary as you log meals.
      </p>
      <Suspense
        fallback={
          <DashboardDiary
            canPersist={false}
            initialEntries={[]}
            initialPantryItems={[]}
            viewerLabel="there"
            isLoading
          />
        }
      >
        <DashboardDiarySection />
      </Suspense>
    </section>
  );
}
