import { getCachedDailyEntries } from "@/app/lib/get-cached-daily-entries";
import { getCachedSavedFoods } from "@/app/lib/get-cached-saved-foods";
import { getCurrentSession } from "@/app/lib/get-current-session";
import DashboardDiary from "@/app/ui/dashboard-diary";

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
  calories: number;
  totalFat: number;
  totalCarbohydrate: number;
  protein: number;
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

export default async function DashboardDiarySection() {
  const session = await getCurrentSession();
  const initialEntries = session?.user?.email
    ? (await getCachedDailyEntries(session.user.email)).map(
        mapEntryToDiaryEntry,
      )
    : [];
  const initialSavedFoods: SavedFoodListItem[] = session?.user?.email
    ? (await getCachedSavedFoods(session.user.email)).map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        servingSize: item.servingSize,
        calories: item.calories,
        totalFat: item.totalFat,
        totalCarbohydrate: item.totalCarbohydrate,
        protein: item.protein,
      }))
    : [];

  return (
    <DashboardDiary
      canPersist={Boolean(session?.user)}
      initialEntries={initialEntries}
      initialSavedFoods={initialSavedFoods}
    />
  );
}
