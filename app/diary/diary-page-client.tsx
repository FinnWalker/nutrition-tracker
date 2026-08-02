"use client";

import Fuse from "fuse.js";
import type { FormEvent } from "react";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  addDailyEntry,
  deleteDailyEntry,
  updateDailyEntryTime,
} from "@/app/diary/actions";
import DiaryMacroPieChart from "@/app/diary/diary-macro-pie-chart";
import {
  getFallbackConsumedTimeValue,
  getConsumedAtFromTimeValue,
  getDefaultConsumedTimeValue,
} from "@/app/lib/diary-consumed-at";
import {
  addDaysToDiaryDate,
  formatDiaryDateLabel,
  getTodayDiaryDate,
} from "@/app/lib/diary-date";
import { groupDiaryEntries } from "@/app/lib/group-diary-entries";
import { getMacroCalorieEstimate } from "@/app/lib/nutrition-validation";
import { formatNutritionNumber } from "@/app/ui/nutrition-display";

type DiaryEntry = {
  id: string;
  entryDate: string;
  consumedAt: string | null;
  createdAt: string;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type SavedFood = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  lastUsedAt: string | null;
};

type SavedFoodDiaryDetails = {
  id: string;
  calories: number;
  totalFat: number;
  totalCarbohydrate: number;
  protein: number;
};

type QuickAddDraft = {
  consumedTime: string | null;
  foodName: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

type DiaryPageClientProps = {
  canPersist: boolean;
  selectedDate: string;
  goals: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  initialEntries: DiaryEntry[];
  initialSavedFoods: SavedFood[];
  isLoading?: boolean;
};

type EntryMutation =
  | { type: "add"; entry: DiaryEntry }
  | { type: "remove"; entryId: string }
  | { type: "update-time"; entryId: string; consumedAt: string | null };

export default function DiaryPageClient({
  canPersist,
  selectedDate,
  goals,
  initialEntries,
  initialSavedFoods,
  isLoading = false,
}: DiaryPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSavedFoodPickerOpen, setIsSavedFoodPickerOpen] = useState(false);
  const [savedFoodConsumedTime, setSavedFoodConsumedTime] = useState<
    string | null
  >(getFallbackConsumedTimeValue());
  const [savedFoodQuery, setSavedFoodQuery] = useState("");
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(
    createInitialQuickAddDraft(),
  );
  const [isPersisting, setIsPersisting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingTimeEntryId, setEditingTimeEntryId] = useState<string | null>(
    null,
  );
  const [editingTimeValue, setEditingTimeValue] = useState<string | null>(null);
  const optimisticEntryCountRef = useRef(0);
  const deferredSavedFoodQuery = useDeferredValue(savedFoodQuery);
  const [optimisticEntries, applyOptimisticEntry] = useOptimistic(
    initialEntries,
    applyEntryMutation,
  );

  const entries = useMemo(
    () =>
      [...optimisticEntries].sort(
        (leftEntry, rightEntry) =>
          getConsumedAtSortValue(leftEntry.consumedAt) -
          getConsumedAtSortValue(rightEntry.consumedAt),
      ),
    [optimisticEntries],
  );
  const searchTerm = deferredSavedFoodQuery.trim();
  const savedFoodResults = useMemo(
    () =>
      searchTerm
        ? new Fuse(initialSavedFoods, {
            threshold: 0.6,
            ignoreLocation: true,
            keys: [
              { name: "name", weight: 0.7 },
              { name: "brand", weight: 0.2 },
              { name: "servingSize", weight: 0.1 },
            ],
          })
            .search(searchTerm)
            .map((result) => result.item)
        : initialSavedFoods.slice(0, 6),
    [initialSavedFoods, searchTerm],
  );
  const totals = entries.reduce(
    (runningTotals, entry) => ({
      calories: runningTotals.calories + entry.calories,
      protein: runningTotals.protein + entry.protein,
      carbs: runningTotals.carbs + entry.carbs,
      fat: runningTotals.fat + entry.fat,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );
  const macroCalorieInsight = getMacroCalorieInsight(totals);
  const timelineGroups = useMemo(() => groupDiaryEntries(entries), [entries]);
  const isToday = selectedDate === getTodayDiaryDate();

  function navigateToDate(nextDate: string) {
    router.push(`${pathname}?date=${nextDate}`);
  }

  function updateQuickAddDraft(
    field: keyof QuickAddDraft,
    value: QuickAddDraft[keyof QuickAddDraft],
  ) {
    setQuickAddDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function ensureSavedFoodConsumedTime() {
    setSavedFoodConsumedTime((current) =>
      current === getFallbackConsumedTimeValue()
        ? getDefaultConsumedTimeValue()
        : current,
    );
  }

  function ensureQuickAddConsumedTime() {
    setQuickAddDraft((current) =>
      current.consumedTime === getFallbackConsumedTimeValue()
        ? {
            ...current,
            consumedTime: getDefaultConsumedTimeValue(),
          }
        : current,
    );
  }

  async function loadSavedFoodDetails(itemId: string) {
    const response = await fetch(`/api/food-library/${itemId}/diary-details`, {
      method: "GET",
    });
    const payload = (await response.json()) as
      SavedFoodDiaryDetails | { error?: string };

    if (!response.ok || !("id" in payload)) {
      throw new Error(
        "error" in payload && payload.error
          ? payload.error
          : "We couldn't load that food.",
      );
    }

    return payload;
  }

  async function addSavedFoodItem(item: SavedFood) {
    if (!canPersist || isLoading || isPersisting) {
      return;
    }

    setIsPersisting(true);
    setSaveError(null);

    try {
      const details = await loadSavedFoodDetails(item.id);
      const optimisticEntryId = createOptimisticEntryId(
        selectedDate,
        optimisticEntryCountRef.current++,
      );
      const nextEntry = createSavedFoodEntry(
        optimisticEntryId,
        item,
        details,
        selectedDate,
        savedFoodConsumedTime,
      );

      startTransition(async () => {
        applyOptimisticEntry({
          type: "add",
          entry: nextEntry,
        });

        try {
          await addDailyEntry({
            entryDate: selectedDate,
            consumedAt: nextEntry.consumedAt,
            foodName: nextEntry.foodName,
            servings: nextEntry.servings,
            savedFoodId: item.id,
            calories: nextEntry.calories,
            protein: nextEntry.protein,
            carbs: nextEntry.carbs,
            fat: nextEntry.fat,
          });
          setIsSavedFoodPickerOpen(false);
          setSavedFoodConsumedTime(getDefaultConsumedTimeValue());
          setSavedFoodQuery("");
          router.refresh();
        } catch {
          setSaveError("We couldn't add that food. Please try again.");
          router.refresh();
        } finally {
          setIsPersisting(false);
        }
      });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "We couldn't load that food.",
      );
      setIsPersisting(false);
    }
  }

  async function handleQuickAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !canPersist ||
      isLoading ||
      isPersisting ||
      !quickAddDraft.foodName.trim()
    ) {
      return;
    }

    const optimisticEntryId = createOptimisticEntryId(
      selectedDate,
      optimisticEntryCountRef.current++,
    );
    const nextEntry = createQuickAddEntry(
      optimisticEntryId,
      quickAddDraft,
      selectedDate,
    );

    setIsPersisting(true);
    setSaveError(null);
    setQuickAddDraft(createInitialQuickAddDraft());

    startTransition(async () => {
      applyOptimisticEntry({
        type: "add",
        entry: nextEntry,
      });

      try {
        await addDailyEntry({
          entryDate: selectedDate,
          consumedAt: nextEntry.consumedAt,
          foodName: nextEntry.foodName,
          servings: nextEntry.servings,
          calories: nextEntry.calories,
          protein: nextEntry.protein,
          carbs: nextEntry.carbs,
          fat: nextEntry.fat,
        });
        setQuickAddDraft(createInitialQuickAddDraft());
        router.refresh();
      } catch {
        setSaveError("We couldn't add that entry. Please try again.");
        setQuickAddDraft(quickAddDraft);
        router.refresh();
      } finally {
        setIsPersisting(false);
      }
    });
  }

  async function removeEntry(entryId: string) {
    if (!canPersist || isLoading || isPersisting) {
      return;
    }

    setIsPersisting(true);
    setSaveError(null);

    startTransition(async () => {
      applyOptimisticEntry({
        type: "remove",
        entryId,
      });

      try {
        await deleteDailyEntry(entryId);
        router.refresh();
      } catch {
        setSaveError("We couldn't remove that entry. Please try again.");
        router.refresh();
      } finally {
        setIsPersisting(false);
      }
    });
  }

  async function saveEntryTime(entryId: string) {
    if (!canPersist || isLoading || isPersisting) {
      return;
    }

    setIsPersisting(true);
    setSaveError(null);

    const nextConsumedAt = editingTimeValue
      ? getConsumedAtFromTimeValue(selectedDate, editingTimeValue).toISOString()
      : null;

    startTransition(async () => {
      applyOptimisticEntry({
        type: "update-time",
        entryId,
        consumedAt: nextConsumedAt,
      });

      try {
        await updateDailyEntryTime(entryId, {
          entryDate: selectedDate,
          consumedAt: nextConsumedAt,
        });
        setEditingTimeEntryId(null);
        setEditingTimeValue(null);
        router.refresh();
      } catch {
        setSaveError("We couldn't update that time. Please try again.");
        router.refresh();
      } finally {
        setIsPersisting(false);
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl">
      <section className="space-y-5 lg:space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isToday ? "Today" : formatDiaryDateLabel(selectedDate)}
              </h1>
              {isToday ? (
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  • {formatDiaryDateLabel(selectedDate)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                navigateToDate(addDaysToDiaryDate(selectedDate, -1))
              }
              disabled={isLoading || isPersisting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-foreground-muted transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <label className="relative min-w-[13rem]">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                aria-hidden="true"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => navigateToDate(event.target.value)}
                disabled={isLoading || isPersisting}
                className="h-10 w-full rounded-xl border border-border bg-white px-10 pr-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                navigateToDate(addDaysToDiaryDate(selectedDate, 1))
              }
              disabled={isLoading || isPersisting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-foreground-muted transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => navigateToDate(getTodayDiaryDate())}
              disabled={isLoading || isPersisting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              Today
            </button>
          </div>
        </div>

        <section className="rounded-[1.6rem] border border-border bg-white p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(12.5rem,16rem)_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-center">
                <DiaryMacroPieChart
                  calories={totals.calories}
                  calorieGoal={goals.calories}
                  protein={totals.protein}
                  carbs={totals.carbs}
                  fat={totals.fat}
                />
              </div>
              <div className="mt-5 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {goals.calories
                    ? `${formatNutritionNumber(totals.calories)} / ${formatNutritionNumber(goals.calories)} kcal`
                    : `${formatNutritionNumber(totals.calories)} kcal`}
                </p>
                <p className="mt-1 text-xs font-medium text-foreground-muted">
                  {goals.calories
                    ? totals.calories > goals.calories
                      ? `${formatNutritionNumber(totals.calories - goals.calories)} kcal over`
                      : `${formatNutritionNumber(goals.calories - totals.calories)} kcal left`
                    : "Set a calorie goal on Goals"}
                </p>
              </div>
              {macroCalorieInsight ? (
                <p className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  {macroCalorieInsight}
                </p>
              ) : null}
            </div>

            <div className="flex min-w-0 items-center">
              <div className="w-full space-y-4 xl:grid xl:grid-cols-3 xl:gap-0 xl:space-y-0">
                <MacroProgress
                  label="Protein"
                  value={totals.protein}
                  target={goals.protein}
                  unit="g"
                  barClass="bg-emerald-500"
                  accentClass="text-emerald-600"
                  trackClass="bg-emerald-100"
                  cardClass="xl:pr-5"
                />
                <MacroProgress
                  label="Carbs"
                  value={totals.carbs}
                  target={goals.carbs}
                  unit="g"
                  barClass="bg-sky-500"
                  accentClass="text-sky-600"
                  trackClass="bg-sky-100"
                  cardClass="xl:px-5"
                />
                <MacroProgress
                  label="Fat"
                  value={totals.fat}
                  target={goals.fat}
                  unit="g"
                  barClass="bg-amber-500"
                  accentClass="text-amber-600"
                  trackClass="bg-amber-100"
                  cardClass="xl:pl-5"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          {canPersist ? (
            <button
              type="button"
              onClick={() => {
                ensureSavedFoodConsumedTime();
                setIsSavedFoodPickerOpen((current) => !current);
              }}
              disabled={isLoading || isPersisting}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add saved food</span>
            </button>
          ) : null}

          {saveError ? (
            <p className="mt-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {saveError}
            </p>
          ) : null}

          {isSavedFoodPickerOpen && canPersist ? (
            <div className="mt-4 rounded-[1.3rem] border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={savedFoodQuery}
                    onChange={(event) => setSavedFoodQuery(event.target.value)}
                    placeholder="Search saved foods..."
                    disabled={isLoading || isPersisting}
                    className="h-11 w-full rounded-xl border border-border bg-white px-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
                <label className="min-w-[8rem]">
                  <span className="sr-only">Saved food time</span>
                  <input
                    type="time"
                    value={savedFoodConsumedTime ?? ""}
                    onFocus={ensureSavedFoodConsumedTime}
                    onChange={(event) =>
                      setSavedFoodConsumedTime(event.target.value || null)
                    }
                    disabled={isLoading || isPersisting}
                    className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSavedFoodConsumedTime(null)}
                  disabled={isLoading || isPersisting}
                  className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    savedFoodConsumedTime === null
                      ? "border-brand bg-brand-muted text-brand-foreground"
                      : "border-border bg-white text-foreground hover:bg-surface"
                  }`}
                >
                  Any time
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-border bg-white">
                {savedFoodResults.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-foreground-muted">
                    No saved foods match that search.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {savedFoodResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          void addSavedFoodItem(item);
                        }}
                        disabled={isLoading || isPersisting}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <FoodThumb name={item.name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-foreground-muted">
                              {item.servingSize || item.brand || "Saved food"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-foreground-muted">
                            {savedFoodConsumedTime ?? "Any time"}
                          </span>
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <div className="space-y-4">
              {timelineGroups.length === 0 ? (
                <div className="rounded-[1.45rem] border border-dashed border-border bg-surface px-4 py-8 text-sm text-foreground-muted sm:px-5">
                  Add your first entry and it will appear on the timeline.
                </div>
              ) : (
                timelineGroups.map((group) => (
                  <section
                    key={group.id}
                    className="rounded-[1.45rem] border border-border bg-surface"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {formatTimelineGroupLabel(
                            group.startTime,
                            group.endTime,
                            group.isAnyTime,
                          )}
                        </h3>
                        <p className="mt-0.5 text-xs text-foreground-muted">
                          {group.subtotal.calories} kcal
                          <span className="mx-2">•</span>
                          {group.entries.length} item
                          {group.entries.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 sm:px-5">
                      {group.entries.map((entry) => (
                        <article
                          key={entry.id}
                          className="flex items-center gap-3"
                        >
                          <FoodThumb name={entry.foodName} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {formatDiaryFoodName(entry.foodName)}
                            </p>
                            <p className="mt-1 text-xs text-foreground-muted">
                              {entry.consumedAt
                                ? formatEntryTime(entry.consumedAt)
                                : "Any time"}
                              <span className="mx-2">•</span>
                              {formatNutritionNumber(entry.servings)} serving
                              {entry.servings === 1 ? "" : "s"}
                              <span className="mx-2">•</span>
                              {entry.calories} kcal
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {canPersist ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTimeEntryId(entry.id);
                                    setEditingTimeValue(
                                      entry.consumedAt
                                        ? formatTimeInputValue(entry.consumedAt)
                                        : null,
                                    );
                                  }}
                                  disabled={isLoading || isPersisting}
                                  className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                                  aria-label={`Edit time for ${entry.foodName}`}
                                  title={
                                    entry.consumedAt
                                      ? `Consumed at ${formatEntryTime(entry.consumedAt)}`
                                      : "Any time"
                                  }
                                >
                                  <Clock3
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void removeEntry(entry.id);
                                  }}
                                  disabled={isLoading || isPersisting}
                                  className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                                  aria-label={`Delete ${entry.foodName}`}
                                  title={
                                    entry.consumedAt
                                      ? `Consumed at ${formatEntryTime(entry.consumedAt)}`
                                      : "Any time"
                                  }
                                >
                                  <Trash2
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>

                    {editingTimeEntryId &&
                    group.entries.some(
                      (entry) => entry.id === editingTimeEntryId,
                    ) ? (
                      <div className="border-t border-border px-4 py-4 sm:px-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <label className="min-w-[8rem]">
                            <span className="sr-only">Entry time</span>
                            <input
                              type="time"
                              value={editingTimeValue ?? ""}
                              onChange={(event) =>
                                setEditingTimeValue(event.target.value || null)
                              }
                              disabled={isLoading || isPersisting}
                              className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingTimeValue(null)}
                            disabled={isLoading || isPersisting}
                            className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                              editingTimeValue === null
                                ? "border-brand bg-brand-muted text-brand-foreground"
                                : "border-border bg-white text-foreground hover:bg-surface"
                            }`}
                          >
                            Any time
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTimeEntryId(null);
                              setEditingTimeValue(null);
                            }}
                            disabled={isLoading || isPersisting}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void saveEntryTime(editingTimeEntryId);
                            }}
                            disabled={isLoading || isPersisting}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Save time
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-border bg-white p-5 sm:p-6">
          <form onSubmit={handleQuickAddSubmit} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={quickAddDraft.foodName}
                onChange={(event) =>
                  updateQuickAddDraft("foodName", event.target.value)
                }
                placeholder="Quick add custom food..."
                disabled={!canPersist || isLoading || isPersisting}
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[16rem] sm:flex-[1_1_18rem]"
                required
              />
              <input
                type="time"
                value={quickAddDraft.consumedTime ?? ""}
                onFocus={ensureQuickAddConsumedTime}
                onChange={(event) =>
                  updateQuickAddDraft(
                    "consumedTime",
                    event.target.value || null,
                  )
                }
                disabled={!canPersist || isLoading || isPersisting}
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-36"
              />
              <button
                type="button"
                onClick={() => updateQuickAddDraft("consumedTime", null)}
                disabled={!canPersist || isLoading || isPersisting}
                className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  quickAddDraft.consumedTime === null
                    ? "border-brand bg-brand-muted text-brand-foreground"
                    : "border-border bg-white text-foreground hover:bg-surface"
                }`}
              >
                Any time
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min="0"
                step="1"
                value={quickAddDraft.calories}
                onChange={(event) =>
                  updateQuickAddDraft("calories", event.target.value)
                }
                placeholder="Calories"
                disabled={!canPersist || isLoading || isPersisting}
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-32"
              />
              <input
                type="number"
                min="0"
                step="0.1"
                value={quickAddDraft.protein}
                onChange={(event) =>
                  updateQuickAddDraft("protein", event.target.value)
                }
                placeholder="Protein"
                disabled={!canPersist || isLoading || isPersisting}
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-32"
              />
              <input
                type="number"
                min="0"
                step="0.1"
                value={quickAddDraft.carbs}
                onChange={(event) =>
                  updateQuickAddDraft("carbs", event.target.value)
                }
                placeholder="Carbs"
                disabled={!canPersist || isLoading || isPersisting}
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-32"
              />
              <input
                type="number"
                min="0"
                step="0.1"
                value={quickAddDraft.fat}
                onChange={(event) =>
                  updateQuickAddDraft("fat", event.target.value)
                }
                placeholder="Fat"
                disabled={!canPersist || isLoading || isPersisting}
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-32"
              />
              <button
                type="submit"
                disabled={
                  !canPersist ||
                  isLoading ||
                  isPersisting ||
                  !quickAddDraft.foodName.trim()
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function MacroProgress({
  label,
  value,
  target,
  unit,
  barClass,
  accentClass,
  trackClass,
  cardClass,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  barClass: string;
  accentClass: string;
  trackClass: string;
  cardClass?: string;
}) {
  const percentage =
    target && target > 0 ? Math.round((value / target) * 100) : null;
  const progress =
    target && target > 0
      ? Math.max(0, Math.min(100, (value / target) * 100))
      : 0;

  return (
    <div
      className={`w-full space-y-3 rounded-[1.1rem] md:rounded-none ${cardClass ?? ""}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className={`text-sm font-semibold ${accentClass}`}>{label}</span>
        {percentage !== null ? (
          <span className="text-xs font-semibold text-foreground-muted">
            {percentage}%
          </span>
        ) : null}
      </div>
      <div className="space-y-2.5">
        <span className="block text-2xl font-bold tracking-tight text-foreground">
          {formatNutritionNumber(value)}
          {unit}
        </span>
        <p className="text-xs font-medium text-foreground-muted">
          {target && target > 0
            ? `Goal: ${formatNutritionNumber(target)}${unit}`
            : "No goal set"}
        </p>
        <div className={`h-2.5 overflow-hidden rounded-full ${trackClass}`}>
          <div
            className={`h-full rounded-full ${barClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function applyEntryMutation(
  currentEntries: DiaryEntry[],
  mutation: EntryMutation,
) {
  switch (mutation.type) {
    case "add":
      return [...currentEntries, mutation.entry];
    case "remove":
      return currentEntries.filter((entry) => entry.id !== mutation.entryId);
    case "update-time":
      return currentEntries.map((entry) =>
        entry.id === mutation.entryId
          ? {
              ...entry,
              consumedAt: mutation.consumedAt,
            }
          : entry,
      );
    default:
      return currentEntries;
  }
}

function createSavedFoodEntry(
  id: string,
  item: SavedFood,
  details: SavedFoodDiaryDetails,
  selectedDate: string,
  consumedTime: string | null,
): DiaryEntry {
  return {
    id,
    entryDate: selectedDate,
    consumedAt: consumedTime
      ? getConsumedAtFromTimeValue(selectedDate, consumedTime).toISOString()
      : null,
    createdAt: new Date().toISOString(),
    foodName: item.name,
    servings: 1,
    calories: Math.max(0, Math.round(details.calories)),
    protein: Math.max(0, details.protein),
    carbs: Math.max(0, details.totalCarbohydrate),
    fat: Math.max(0, details.totalFat),
  };
}

function createQuickAddEntry(
  id: string,
  draft: QuickAddDraft,
  selectedDate: string,
): DiaryEntry {
  return {
    id,
    entryDate: selectedDate,
    consumedAt: draft.consumedTime
      ? getConsumedAtFromTimeValue(
          selectedDate,
          draft.consumedTime,
        ).toISOString()
      : null,
    createdAt: new Date().toISOString(),
    foodName: draft.foodName.trim(),
    servings: 1,
    calories: Math.max(0, Math.round(parseNumber(draft.calories))),
    protein: Math.max(0, parseNumber(draft.protein)),
    carbs: Math.max(0, parseNumber(draft.carbs)),
    fat: Math.max(0, parseNumber(draft.fat)),
  };
}

function createInitialQuickAddDraft(): QuickAddDraft {
  return {
    consumedTime: getFallbackConsumedTimeValue(),
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  };
}

function createOptimisticEntryId(selectedDate: string, count: number) {
  return `optimistic-${selectedDate}-${count}`;
}

function parseNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEntryTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMacroCalorieInsight({
  calories,
  protein,
  carbs,
  fat,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const { estimatedCalories, calorieGap } = getMacroCalorieEstimate({
    calories,
    protein,
    carbs,
    fat,
  });

  if (calories <= 0 || Math.abs(calorieGap) <= 20) {
    return null;
  }

  if (calorieGap > 0) {
    return `${formatNutritionNumber(calorieGap)} kcal unaccounted for based on the logged macros.`;
  }

  return `Macros estimate ${formatNutritionNumber(estimatedCalories)} kcal, which is ${formatNutritionNumber(Math.abs(calorieGap))} kcal above the logged calories.`;
}

function formatTimelineGroupLabel(
  startTime: string | null,
  endTime: string | null,
  isAnyTime: boolean,
) {
  if (isAnyTime || !startTime || !endTime) {
    return "Any time";
  }

  const formattedStartTime = formatEntryTime(startTime);
  const formattedEndTime = formatEntryTime(endTime);

  return formattedStartTime === formattedEndTime
    ? formattedStartTime
    : `${formattedStartTime} - ${formattedEndTime}`;
}

function formatTimeInputValue(value: string) {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getConsumedAtSortValue(consumedAt: string | null) {
  return consumedAt ? new Date(consumedAt).getTime() : Number.POSITIVE_INFINITY;
}

function formatDiaryFoodName(value: string) {
  return value.replace(/\s+\([^()]+\)$/, "");
}

function FoodThumb({ name }: { name: string }) {
  const initials = formatDiaryFoodName(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-brand-muted text-sm font-semibold text-brand-foreground">
      <span aria-hidden="true">{initials || "F"}</span>
    </div>
  );
}
