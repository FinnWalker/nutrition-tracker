import { Suspense } from "react";
import DashboardDiary from "@/app/ui/dashboard-diary";
import DashboardDiarySection from "./dashboard-diary-section";

export const unstable_instant = false;

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-4 text-lg text-foreground-muted">
        Explore the diary flow right away. If you are signed in, your saved
        entries will stream in automatically.
      </p>
      <Suspense
        fallback={
          <DashboardDiary
            canPersist={false}
            initialEntries={[]}
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
