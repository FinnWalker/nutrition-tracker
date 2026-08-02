import { Suspense } from "react";
import { getCachedSavedFoods } from "@/app/lib/get-cached-saved-foods";
import { getCurrentSession } from "@/app/lib/get-current-session";
import FoodLibraryPageClient from "./food-library-page-client";

export default function FoodLibraryPage() {
  return (
    <Suspense fallback={<FoodLibraryPageFallback />}>
      <FoodLibraryPageContent />
    </Suspense>
  );
}

async function FoodLibraryPageContent() {
  const session = await getCurrentSession();
  const items = session?.user?.email
    ? await getCachedSavedFoods(session.user.email)
    : [];

  return (
    <FoodLibraryPageClient
      canBrowse={Boolean(session?.user)}
      items={items.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        serving: item.servingSize,
        calories: item.calories,
        protein: item.protein,
        carbs: item.totalCarbohydrate,
        fat: item.totalFat,
      }))}
    />
  );
}

function FoodLibraryPageFallback() {
  return (
    <main className="mx-auto w-full max-w-7xl">
      <section className="space-y-5 lg:space-y-8">
        <div className="h-9 w-48 rounded-full bg-surface-elevated sm:h-10 lg:h-11" />

        <div className="space-y-3 lg:hidden">
          <div className="h-11 w-full rounded-xl bg-surface-elevated" />
          <div className="h-11 w-40 rounded-xl bg-surface-elevated" />
        </div>

        <div className="hidden lg:flex lg:flex-col lg:gap-3 xl:flex-row xl:items-center">
          <div className="h-11 flex-1 rounded-xl bg-surface-elevated" />
          <div className="flex flex-wrap gap-2.5">
            <div className="h-11 w-20 rounded-xl bg-surface-elevated" />
            <div className="h-11 w-24 rounded-xl bg-surface-elevated" />
            <div className="h-11 w-28 rounded-xl bg-surface-elevated" />
            <div className="h-11 w-24 rounded-xl bg-surface-elevated" />
          </div>
        </div>

        <div className="bg-white">
          <div className="hidden lg:block">
            <div className="grid grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))] gap-0 border-b border-border px-5 py-4">
              <div className="h-3 w-16 rounded-full bg-surface-elevated" />
              <div className="h-3 w-16 rounded-full bg-surface-elevated" />
              <div className="h-3 w-14 rounded-full bg-surface-elevated" />
              <div className="h-3 w-12 rounded-full bg-surface-elevated" />
              <div className="h-3 w-8 rounded-full bg-surface-elevated" />
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))] items-center gap-0 border-b border-border px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-[4.35rem] w-[4.35rem] rounded-[1rem] bg-surface-elevated" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded-full bg-surface-elevated" />
                    <div className="h-3 w-20 rounded-full bg-surface-elevated" />
                  </div>
                </div>
                <div className="h-4 w-16 rounded-full bg-surface-elevated" />
                <div className="h-4 w-12 rounded-full bg-surface-elevated" />
                <div className="h-4 w-12 rounded-full bg-surface-elevated" />
                <div className="h-4 w-10 rounded-full bg-surface-elevated" />
              </div>
            ))}
          </div>

          <div className="divide-y divide-border lg:hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <div className="h-[4.35rem] w-[4.35rem] shrink-0 rounded-[1rem] bg-surface-elevated" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-full bg-surface-elevated" />
                  <div className="h-3 w-20 rounded-full bg-surface-elevated" />
                </div>
                <div className="h-4 w-16 rounded-full bg-surface-elevated" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
