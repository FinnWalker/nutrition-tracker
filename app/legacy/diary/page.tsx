import { Suspense } from "react";
import { getTodayDiaryDate, normalizeDiaryDate } from "@/app/lib/diary-date";
import DiaryManager from "@/app/ui/diary-manager";
import PageContainer from "@/app/ui/page-container";
import DiarySection from "@/app/diary/diary-section";

export const unstable_instant = false;

export default async function LegacyDiaryPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string | string[] }>;
} = {}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const hasExplicitDate = typeof resolvedSearchParams.date === "string";
  const todayDate = getTodayDiaryDate();
  const selectedDate = normalizeDiaryDate(resolvedSearchParams.date, todayDate);

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
            selectedDate={selectedDate}
            todayDate={todayDate}
            hasExplicitDate={hasExplicitDate}
            isLoading
          />
        }
      >
        <DiarySection
          selectedDate={selectedDate}
          hasExplicitDate={hasExplicitDate}
        />
      </Suspense>
    </PageContainer>
  );
}
