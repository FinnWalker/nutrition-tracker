import { Suspense } from "react";
import { getCachedDailyEntries } from "@/app/lib/get-cached-daily-entries";
import { normalizeDiaryDate } from "@/app/lib/diary-date";
import { getCachedSavedFoodSummaries } from "@/app/lib/get-cached-saved-food-summaries";
import { getCurrentSession } from "@/app/lib/get-current-session";
import DiaryPageClient from "./diary-page-client";

const SERVER_FALLBACK_DIARY_DATE = "2026-08-02";

export default function DiaryPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string | string[] }>;
} = {}) {
  return (
    <Suspense
      fallback={
        <DiaryPageClient
          canPersist={false}
          selectedDate={SERVER_FALLBACK_DIARY_DATE}
          initialEntries={[]}
          initialSavedFoods={[]}
          isLoading
        />
      }
    >
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
  const selectedDate = normalizeDiaryDate(
    resolvedSearchParams.date,
    SERVER_FALLBACK_DIARY_DATE,
  );
  const session = await getCurrentSession();
  const initialEntries = session?.user?.email
    ? await getCachedDailyEntries(session.user.email, selectedDate)
    : [];
  const initialSavedFoods = session?.user?.email
    ? await getCachedSavedFoodSummaries(session.user.email)
    : [];

  return (
    <DiaryPageClient
      canPersist={Boolean(session?.user)}
      selectedDate={selectedDate}
      initialEntries={initialEntries.map((entry) => ({
        id: entry.id,
        entryDate: entry.entryDate.toISOString().slice(0, 10),
        createdAt: entry.createdAt.toISOString(),
        mealCategory: normalizeMealCategory(entry.mealCategory),
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

function normalizeMealCategory(value: string) {
  switch (value) {
    case "BREAKFAST":
    case "LUNCH":
    case "DINNER":
    case "SNACK":
    case "DRINK":
      return value;
    default:
      return "SNACK";
  }
}
