import { getCachedDailyEntries } from "@/app/lib/get-cached-daily-entries";
import { getCurrentSession } from "@/app/lib/get-current-session";
import DashboardDiary from "@/app/ui/dashboard-diary";

export const unstable_instant = false;

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const viewerLabel = session?.user?.name ?? session?.user?.email ?? "there";
  const initialEntries = session?.user?.email
    ? (await getCachedDailyEntries(session.user.email)).map((entry) => ({
        id: entry.id,
        entryDate: entry.entryDate.toISOString().slice(0, 10),
        foodName: entry.foodName,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      }))
    : [];

  return (
    <section className="mx-auto w-full max-w-5xl">
      <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-4 text-lg text-foreground-muted">
        {session?.user
          ? `Signed in as ${viewerLabel}.`
          : "Explore the diary flow before you create an account."}
      </p>
      <DashboardDiary
        canPersist={Boolean(session?.user)}
        initialEntries={initialEntries}
        viewerLabel={viewerLabel}
      />
    </section>
  );
}
