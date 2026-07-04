import { getCachedDailyEntries } from "@/app/lib/get-cached-daily-entries";
import { getCurrentSession } from "@/app/lib/get-current-session";
import DashboardDiary from "@/app/ui/dashboard-diary";

type DiaryEntry = {
  id: string;
  entryDate: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function mapEntryToDiaryEntry(entry: {
  id: string;
  entryDate: Date;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): DiaryEntry {
  return {
    id: entry.id,
    entryDate: entry.entryDate.toISOString().slice(0, 10),
    foodName: entry.foodName,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  };
}

export default async function DashboardDiarySection() {
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  const session = await getCurrentSession();
  const viewerLabel = session?.user?.name ?? session?.user?.email ?? "there";
  const initialEntries = session?.user?.email
    ? (await getCachedDailyEntries(session.user.email)).map(
        mapEntryToDiaryEntry,
      )
    : [];

  return (
    <DashboardDiary
      canPersist={Boolean(session?.user)}
      initialEntries={initialEntries}
      viewerLabel={viewerLabel}
    />
  );
}
