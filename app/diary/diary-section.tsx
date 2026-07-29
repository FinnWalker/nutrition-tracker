import { getCachedDailyEntries } from "@/app/lib/get-cached-daily-entries";
import { normalizeDiaryDate } from "@/app/lib/diary-date";
import { getCachedSavedFoodSummaries } from "@/app/lib/get-cached-saved-food-summaries";
import { getCurrentSession } from "@/app/lib/get-current-session";
import DiaryManager from "@/app/ui/diary-manager";

type DiaryEntry = {
  id: string;
  entryDate: string;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type SavedFoodListItem = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  lastUsedAt: string | null;
};

function mapEntryToDiaryEntry(entry: {
  id: string;
  entryDate: Date;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): DiaryEntry {
  return {
    id: entry.id,
    entryDate: entry.entryDate.toISOString().slice(0, 10),
    foodName: entry.foodName,
    servings: entry.servings,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  };
}

export default async function DiarySection({
  selectedDate,
  hasExplicitDate = true,
}: {
  selectedDate?: string;
  hasExplicitDate?: boolean;
} = {}) {
  const session = await getCurrentSession();
  const resolvedSelectedDate = normalizeDiaryDate(selectedDate);
  const initialEntries = session?.user?.email
    ? (
        await getCachedDailyEntries(session.user.email, resolvedSelectedDate)
      ).map(mapEntryToDiaryEntry)
    : [];
  const initialSavedFoods: SavedFoodListItem[] = session?.user?.email
    ? (await getCachedSavedFoodSummaries(session.user.email)).map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        servingSize: item.servingSize,
        lastUsedAt:
          item.lastUsedAt instanceof Date
            ? item.lastUsedAt.toISOString()
            : (item.lastUsedAt ?? null),
      }))
    : [];

  return (
    <DiaryManager
      canPersist={Boolean(session?.user)}
      initialEntries={initialEntries}
      initialSavedFoods={initialSavedFoods}
      selectedDate={resolvedSelectedDate}
      hasExplicitDate={hasExplicitDate}
    />
  );
}
