import { Suspense } from "react";
import { getCachedDailyEntries } from "@/app/lib/get-cached-daily-entries";
import { getTodayDiaryDate, normalizeDiaryDate } from "@/app/lib/diary-date";
import { getCachedSavedFoodSummaries } from "@/app/lib/get-cached-saved-food-summaries";
import { getCurrentSession } from "@/app/lib/get-current-session";
import { getCachedUserGoals } from "@/app/lib/get-cached-user-goals";
import DiaryPageClient from "./diary-page-client";

export default function DiaryPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string | string[] }>;
} = {}) {
  return (
    <Suspense fallback={<DiaryPageFallback />}>
      <DiaryPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DiaryPageContent({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const todayDate = getTodayDiaryDate();
  const selectedDate = normalizeDiaryDate(resolvedSearchParams.date, todayDate);
  const session = await getCurrentSession();
  const initialEntries = session?.user?.email
    ? await getCachedDailyEntries(session.user.email, selectedDate)
    : [];
  const initialSavedFoods = session?.user?.email
    ? await getCachedSavedFoodSummaries(session.user.email)
    : [];
  const userGoals = session?.user?.email
    ? await getCachedUserGoals(session.user.email)
    : null;

  return (
    <DiaryPageClient
      canPersist={Boolean(session?.user)}
      selectedDate={selectedDate}
      todayDate={todayDate}
      goals={{
        calories: userGoals?.dailyCalorieGoal ?? null,
        protein: userGoals?.dailyProteinGoal ?? null,
        carbs: userGoals?.dailyCarbsGoal ?? null,
        fat: userGoals?.dailyFatGoal ?? null,
      }}
      initialEntries={initialEntries.map((entry) => ({
        id: entry.id,
        entryDate: entry.entryDate.toISOString().slice(0, 10),
        consumedAt: entry.consumedAt?.toISOString() ?? null,
        createdAt: entry.createdAt.toISOString(),
        foodName: entry.foodName,
        servings: entry.servings,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      }))}
      initialSavedFoods={initialSavedFoods.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        servingSize: item.servingSize,
        lastUsedAt:
          item.lastUsedAt instanceof Date
            ? item.lastUsedAt.toISOString()
            : (item.lastUsedAt ?? null),
      }))}
    />
  );
}

function DiaryPageFallback() {
  return (
    <main className="mx-auto w-full max-w-7xl">
      <section className="space-y-5 lg:space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="h-9 w-56 animate-pulse rounded-xl bg-surface" />
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-surface" />
            <div className="h-10 min-w-[13rem] animate-pulse rounded-xl bg-surface" />
            <div className="h-10 w-10 animate-pulse rounded-xl bg-surface" />
            <div className="h-10 w-20 animate-pulse rounded-xl bg-surface" />
          </div>
        </div>

        <section className="rounded-[1.6rem] border border-border bg-white p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(12.5rem,16rem)_minmax(0,1fr)] md:items-center">
            <div className="h-48 animate-pulse rounded-[1.2rem] bg-surface" />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="h-28 animate-pulse rounded-[1.1rem] bg-surface" />
              <div className="h-28 animate-pulse rounded-[1.1rem] bg-surface" />
              <div className="h-28 animate-pulse rounded-[1.1rem] bg-surface" />
            </div>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-border bg-white p-5 sm:p-6">
          <div className="h-11 w-36 animate-pulse rounded-xl bg-surface" />
          <div className="mt-4 h-64 animate-pulse rounded-[1.2rem] bg-surface" />
        </section>
      </section>
    </main>
  );
}
