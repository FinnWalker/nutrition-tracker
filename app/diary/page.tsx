import { Suspense } from "react";
import DiaryManager from "@/app/ui/diary-manager";
import PageContainer from "@/app/ui/page-container";
import DiarySection from "./diary-section";

export const unstable_instant = false;

export default function DiaryPage() {
  return (
    <PageContainer>
      <h1 className="text-4xl font-semibold tracking-tight">Diary</h1>
      <p className="mt-4 text-lg text-foreground-muted">
        Review your daily totals, pull foods straight from your saved foods, and
        log meals as your diary fills out through the day.
      </p>
      <Suspense
        fallback={
          <DiaryManager
            canPersist={false}
            initialEntries={[]}
            initialSavedFoods={[]}
            isLoading
          />
        }
      >
        <DiarySection />
      </Suspense>
    </PageContainer>
  );
}
