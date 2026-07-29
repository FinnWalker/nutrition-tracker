"use client";

import Fuse from "fuse.js";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  useRef,
  startTransition,
  useDeferredValue,
  useOptimistic,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  addDailyEntry,
  clearDailyEntries as clearSavedDailyEntries,
  deleteDailyEntry as deleteSavedDailyEntry,
} from "@/app/diary/actions";
import { formatNutritionNumber, SummaryCard } from "@/app/ui/nutrition-display";

type DiaryManagerProps = {
  canPersist: boolean;
  initialEntries: DiaryEntry[];
  initialSavedFoods: SavedFood[];
  isLoading?: boolean;
};

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

type DraftEntry = {
  entryDate: string;
  foodName: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

type OptimisticEntryMutation =
  | { type: "add"; entry: DiaryEntry }
  | { type: "remove"; entryId: string }
  | { type: "clear" };

const STORAGE_KEY = "nutrition-tracker-diary-draft";
const STORAGE_EVENT = "nutrition-tracker-diary-storage";
const EMPTY_ENTRIES: DiaryEntry[] = [];
let lastStoredEntriesRaw: string | null = null;
let lastStoredEntriesSnapshot: DiaryEntry[] = EMPTY_ENTRIES;

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialDraft = (): DraftEntry => ({
  entryDate: getTodayDateInputValue(),
  foodName: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
});

function normalizeDiaryEntry(entry: Partial<DiaryEntry>): DiaryEntry {
  return {
    id: entry.id ?? crypto.randomUUID(),
    entryDate: entry.entryDate ?? getTodayDateInputValue(),
    foodName: entry.foodName ?? "",
    servings:
      typeof entry.servings === "number" && Number.isFinite(entry.servings)
        ? entry.servings
        : 1,
    calories:
      typeof entry.calories === "number" && Number.isFinite(entry.calories)
        ? entry.calories
        : 0,
    protein:
      typeof entry.protein === "number" && Number.isFinite(entry.protein)
        ? entry.protein
        : 0,
    carbs:
      typeof entry.carbs === "number" && Number.isFinite(entry.carbs)
        ? entry.carbs
        : 0,
    fat:
      typeof entry.fat === "number" && Number.isFinite(entry.fat)
        ? entry.fat
        : 0,
  };
}

function readAnonymousEntries() {
  const savedEntries = window.localStorage.getItem(STORAGE_KEY);

  if (!savedEntries) {
    lastStoredEntriesRaw = null;
    lastStoredEntriesSnapshot = EMPTY_ENTRIES;
    return EMPTY_ENTRIES;
  }

  if (savedEntries === lastStoredEntriesRaw) {
    return lastStoredEntriesSnapshot;
  }

  try {
    const parsed = JSON.parse(savedEntries) as Partial<DiaryEntry>[];
    lastStoredEntriesRaw = savedEntries;
    lastStoredEntriesSnapshot = Array.isArray(parsed)
      ? parsed.map(normalizeDiaryEntry)
      : EMPTY_ENTRIES;
    return lastStoredEntriesSnapshot;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    lastStoredEntriesRaw = null;
    lastStoredEntriesSnapshot = EMPTY_ENTRIES;
    return EMPTY_ENTRIES;
  }
}

function subscribeToAnonymousEntries(onStoreChange: () => void) {
  const handleStorageChange = (event: Event) => {
    if (
      event instanceof StorageEvent &&
      event.key &&
      event.key !== STORAGE_KEY
    ) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(STORAGE_EVENT, handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  };
}

function writeAnonymousEntries(entries: DiaryEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function resetDraftKeepingDate(setDraft: Dispatch<SetStateAction<DraftEntry>>) {
  setDraft((current) => ({
    ...initialDraft(),
    entryDate: current.entryDate,
  }));
}

function parseNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function applyEntryMutation(
  currentEntries: DiaryEntry[],
  mutation: OptimisticEntryMutation,
) {
  switch (mutation.type) {
    case "add":
      return [mutation.entry, ...currentEntries];
    case "remove":
      return currentEntries.filter((entry) => entry.id !== mutation.entryId);
    case "clear":
      return [];
    default:
      return currentEntries;
  }
}

function createManualEntry(draft: DraftEntry): DiaryEntry {
  return {
    id: crypto.randomUUID(),
    entryDate: draft.entryDate,
    foodName: draft.foodName.trim(),
    servings: 1,
    calories: Math.max(0, Math.round(parseNumber(draft.calories))),
    protein: Math.max(0, parseNumber(draft.protein)),
    carbs: Math.max(0, parseNumber(draft.carbs)),
    fat: Math.max(0, parseNumber(draft.fat)),
  };
}

function createSavedFoodEntry(
  item: SavedFood,
  details: SavedFoodDiaryDetails,
  entryDate: string,
  portions: number,
): DiaryEntry {
  const label = item.brand ? `${item.name} (${item.brand})` : item.name;

  return {
    id: crypto.randomUUID(),
    entryDate,
    foodName: label,
    servings: roundMacro(portions),
    calories: Math.max(0, Math.round(details.calories * portions)),
    protein: Math.max(0, roundMacro(details.protein * portions)),
    carbs: Math.max(0, roundMacro(details.totalCarbohydrate * portions)),
    fat: Math.max(0, roundMacro(details.totalFat * portions)),
  };
}

function DiaryTable({
  entries,
  isDisabled,
  onRemove,
}: {
  entries: DiaryEntry[];
  isDisabled: boolean;
  onRemove: (entryId: string) => void;
}) {
  return (
    <div className="mt-6 overflow-x-auto border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface">
          <tr className="text-left text-foreground-muted">
            <th className="px-4 py-3 font-medium">Food</th>
            <th className="px-4 py-3 font-medium">Servings</th>
            <th className="px-4 py-3 font-medium">Calories</th>
            <th className="px-4 py-3 font-medium">Carbs</th>
            <th className="px-4 py-3 font-medium">Fat</th>
            <th className="px-4 py-3 font-medium">Protein</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    disabled={isDisabled}
                    aria-label={`Delete ${entry.foodName}`}
                    className="p-1.5 text-foreground-muted"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="font-medium text-foreground">
                    {entry.foodName}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                {formatNutritionNumber(entry.servings)}
              </td>
              <td className="px-4 py-3">{entry.calories}</td>
              <td className="px-4 py-3">
                {formatNutritionNumber(entry.carbs)}g
              </td>
              <td className="px-4 py-3">{formatNutritionNumber(entry.fat)}g</td>
              <td className="px-4 py-3">
                {formatNutritionNumber(entry.protein)}g
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DiaryManager({
  canPersist,
  initialEntries,
  initialSavedFoods,
  isLoading = false,
}: DiaryManagerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftEntry>(initialDraft);
  const entryDate = getTodayDateInputValue();
  const [savedFoodQuery, setSavedFoodQuery] = useState("");
  const [selectedSavedFoodId, setSelectedSavedFoodId] = useState("");
  const [portions, setPortions] = useState("1");
  const [isPersisting, setIsPersisting] = useState(false);
  const [isLoadingSavedFoodDetails, setIsLoadingSavedFoodDetails] =
    useState(false);
  const [savedFoodDetails, setSavedFoodDetails] =
    useState<SavedFoodDiaryDetails | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFoodLoadError, setSavedFoodLoadError] = useState<string | null>(
    null,
  );
  const savedFoodRequestIdRef = useRef(0);
  const deferredSavedFoodQuery = useDeferredValue(savedFoodQuery);
  const anonymousEntries = useSyncExternalStore(
    subscribeToAnonymousEntries,
    readAnonymousEntries,
    () => EMPTY_ENTRIES,
  );
  const [optimisticEntries, applyOptimisticMutation] = useOptimistic(
    initialEntries,
    applyEntryMutation,
  );

  const isDisabled = isLoading || isPersisting;
  const entries = isLoading
    ? EMPTY_ENTRIES
    : canPersist
      ? optimisticEntries
      : anonymousEntries;
  const searchTerm = deferredSavedFoodQuery.trim();
  const filteredSavedFoods = searchTerm
    ? new Fuse(initialSavedFoods, {
        threshold: 0.6,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: "name", weight: 0.7 },
          { name: "brand", weight: 0.3 },
        ],
      })
        .search(searchTerm)
        .map((result) => result.item)
    : initialSavedFoods;
  const activeSavedFood =
    initialSavedFoods.find((item) => item.id === selectedSavedFoodId) ?? null;
  const parsedPortions = parseNumber(portions);
  const hasValidPortions = parsedPortions > 0;
  const hasLoadedSavedFoodDetails =
    savedFoodDetails?.id === selectedSavedFoodId && activeSavedFood !== null;

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

  function updateDraft<K extends keyof DraftEntry>(
    field: K,
    value: DraftEntry[K],
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function selectSavedFood(itemId: string) {
    if (!canPersist || isDisabled) {
      return;
    }

    const requestId = savedFoodRequestIdRef.current + 1;
    savedFoodRequestIdRef.current = requestId;
    setSelectedSavedFoodId(itemId);
    setSavedFoodDetails(null);
    setSavedFoodLoadError(null);
    setIsLoadingSavedFoodDetails(true);

    try {
      const response = await fetch(
        `/api/food-library/${itemId}/diary-details`,
        {
          method: "GET",
        },
      );
      const payload = (await response.json()) as
        SavedFoodDiaryDetails | { error?: string };

      if (!response.ok || !("id" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "We couldn't load that saved food.",
        );
      }

      if (savedFoodRequestIdRef.current === requestId) {
        setSavedFoodDetails(payload);
      }
    } catch (error) {
      if (savedFoodRequestIdRef.current !== requestId) {
        return;
      }

      setSavedFoodLoadError(
        error instanceof Error
          ? error.message
          : "We couldn't load that saved food.",
      );
    } finally {
      if (savedFoodRequestIdRef.current === requestId) {
        setIsLoadingSavedFoodDetails(false);
      }
    }
  }

  async function persistEntry(
    nextEntry: DiaryEntry,
    draftSnapshot?: DraftEntry,
  ) {
    const mutation: OptimisticEntryMutation = {
      type: "add",
      entry: nextEntry,
    };

    setIsPersisting(true);
    setSaveError(null);
    startTransition(async () => {
      applyOptimisticMutation(mutation);

      try {
        await addDailyEntry({
          entryDate: nextEntry.entryDate,
          foodName: nextEntry.foodName,
          servings: nextEntry.servings,
          savedFoodId: activeSavedFood?.id,
          calories: nextEntry.calories,
          protein: nextEntry.protein,
          carbs: nextEntry.carbs,
          fat: nextEntry.fat,
        });
        if (canPersist) {
          savedFoodRequestIdRef.current += 1;
          setSelectedSavedFoodId("");
          setSavedFoodQuery("");
          setPortions("1");
          setSavedFoodDetails(null);
          setSavedFoodLoadError(null);
        }
        router.refresh();
      } catch {
        if (draftSnapshot) {
          setDraft(draftSnapshot);
        }

        setSaveError("We couldn't save that entry. Please try again.");
      } finally {
        setIsPersisting(false);
      }
    });
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const foodName = draft.foodName.trim();
    if (!foodName) {
      return;
    }

    const nextEntry = createManualEntry(draft);

    if (canPersist) {
      const draftSnapshot = draft;
      resetDraftKeepingDate(setDraft);
      await persistEntry(nextEntry, draftSnapshot);
      return;
    }

    writeAnonymousEntries([nextEntry, ...anonymousEntries]);
    resetDraftKeepingDate(setDraft);
  }

  async function handleSavedFoodSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      isDisabled ||
      !activeSavedFood ||
      !savedFoodDetails ||
      !hasValidPortions ||
      !canPersist
    ) {
      return;
    }

    const nextEntry = createSavedFoodEntry(
      activeSavedFood,
      savedFoodDetails,
      entryDate,
      parsedPortions,
    );
    await persistEntry(nextEntry);
  }

  async function removeEntry(entryId: string) {
    if (isLoading) {
      return;
    }

    if (canPersist) {
      const mutation: OptimisticEntryMutation = { type: "remove", entryId };

      setIsPersisting(true);
      setSaveError(null);
      startTransition(async () => {
        applyOptimisticMutation(mutation);

        try {
          await deleteSavedDailyEntry(entryId);
          router.refresh();
        } catch {
          setSaveError("We couldn't remove that entry. Please try again.");
        } finally {
          setIsPersisting(false);
        }
      });

      return;
    }

    writeAnonymousEntries(
      anonymousEntries.filter((entry) => entry.id !== entryId),
    );
  }

  async function clearEntries() {
    if (isLoading) {
      return;
    }

    if (canPersist) {
      const mutation: OptimisticEntryMutation = { type: "clear" };

      setIsPersisting(true);
      setSaveError(null);
      startTransition(async () => {
        applyOptimisticMutation(mutation);

        try {
          await clearSavedDailyEntries();
          router.refresh();
        } catch {
          setSaveError("We couldn't clear your diary. Please try again.");
        } finally {
          setIsPersisting(false);
        }
      });

      return;
    }

    writeAnonymousEntries([]);
  }

  return (
    <div className="mt-8 space-y-6">
      <section
        className={`border border-border bg-surface p-6 ${isLoading ? "opacity-60" : "opacity-100"}`}
        aria-busy={isLoading}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
              Summary
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Today&apos;s totals
            </h2>
          </div>
          {entries.length > 0 ? (
            <button
              type="button"
              onClick={clearEntries}
              disabled={isDisabled}
              className="border border-border px-4 py-2 text-sm"
            >
              Clear all
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Calories" value={`${totals.calories}`} />
          <SummaryCard
            label="Carbs"
            value={`${formatNutritionNumber(totals.carbs)}g`}
          />
          <SummaryCard
            label="Fat"
            value={`${formatNutritionNumber(totals.fat)}g`}
          />
          <SummaryCard
            label="Protein"
            value={`${formatNutritionNumber(totals.protein)}g`}
          />
        </div>

        {canPersist ? (
          initialSavedFoods.length > 0 ? (
            <form
              onSubmit={handleSavedFoodSubmit}
              className="mt-6 border border-border bg-background p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                    Add from saved foods
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                    Search your saved foods
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
                <div>
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">
                      Search saved foods
                    </span>
                    <input
                      type="search"
                      name="savedFoodQuery"
                      value={savedFoodQuery}
                      onChange={(event) =>
                        setSavedFoodQuery(event.target.value)
                      }
                      disabled={isDisabled}
                      placeholder="Search foods, brands, or serving sizes"
                      className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm outline-none"
                    />
                  </label>

                  <div className="mt-4 max-h-72 overflow-y-auto border border-border bg-surface">
                    {filteredSavedFoods.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-foreground-muted">
                        No saved foods match that search.
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {filteredSavedFoods.map((item) => {
                          const isSelected = item.id === selectedSavedFoodId;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                void selectSavedFood(item.id);
                              }}
                              disabled={isDisabled}
                              className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left ${isSelected ? "bg-brand-muted" : ""}`}
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-foreground">
                                  {item.name}
                                </div>
                                {item.brand ? (
                                  <div className="mt-1 text-xs text-foreground-muted">
                                    {item.brand}
                                  </div>
                                ) : null}
                                {item.servingSize ? (
                                  <div className="mt-1 text-xs text-foreground-muted">
                                    {item.servingSize}
                                  </div>
                                ) : null}
                                {item.lastUsedAt ? (
                                  <div className="mt-1 text-xs text-foreground-muted">
                                    Recently used
                                  </div>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-border bg-surface p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                    Selection
                  </p>
                  {activeSavedFood ? (
                    <>
                      <h4 className="mt-3 text-xl font-semibold tracking-tight">
                        {activeSavedFood.name}
                      </h4>
                      {activeSavedFood.brand ? (
                        <p className="mt-1 text-sm text-foreground-muted">
                          {activeSavedFood.brand}
                        </p>
                      ) : null}
                      {activeSavedFood.servingSize ? (
                        <p className="mt-1 text-sm text-foreground-muted">
                          Serving: {activeSavedFood.servingSize}
                        </p>
                      ) : null}

                      <label className="mt-5 block">
                        <span className="text-sm font-medium text-foreground">
                          Portions
                        </span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          name="portions"
                          value={portions}
                          onChange={(event) => setPortions(event.target.value)}
                          disabled={isDisabled}
                          className="mt-2 w-full border border-border bg-surface-elevated px-4 py-3 text-sm outline-none"
                          required
                        />
                      </label>

                      {isLoadingSavedFoodDetails ? (
                        <div className="mt-5 border border-dashed border-border bg-background px-4 py-6 text-sm text-foreground-muted">
                          Loading nutrition details...
                        </div>
                      ) : savedFoodLoadError ? (
                        <p className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {savedFoodLoadError}
                        </p>
                      ) : hasLoadedSavedFoodDetails && savedFoodDetails ? (
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <SummaryCard
                            label="Calories"
                            value={`${Math.max(0, Math.round(savedFoodDetails.calories * parsedPortions))}`}
                          />
                          <SummaryCard
                            label="Carbs"
                            value={`${formatNutritionNumber(Math.max(0, roundMacro(savedFoodDetails.totalCarbohydrate * parsedPortions)))}g`}
                          />
                          <SummaryCard
                            label="Fat"
                            value={`${formatNutritionNumber(Math.max(0, roundMacro(savedFoodDetails.totalFat * parsedPortions)))}g`}
                          />
                          <SummaryCard
                            label="Protein"
                            value={`${formatNutritionNumber(Math.max(0, roundMacro(savedFoodDetails.protein * parsedPortions)))}g`}
                          />
                        </div>
                      ) : null}

                      <button
                        type="submit"
                        disabled={
                          isDisabled ||
                          isLoadingSavedFoodDetails ||
                          !hasLoadedSavedFoodDetails ||
                          !hasValidPortions
                        }
                        className="mt-5 bg-brand px-4 py-2 text-sm text-white"
                      >
                        {isLoading
                          ? "Loading..."
                          : isPersisting
                            ? "Saving..."
                            : "Add to diary"}
                      </button>
                    </>
                  ) : (
                    <div className="mt-3 border border-dashed border-border bg-background px-4 py-6 text-sm leading-7 text-foreground-muted">
                      Choose a saved food from the results to scale servings and
                      add it to your diary.
                    </div>
                  )}
                </div>
              </div>

              {saveError ? (
                <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </p>
              ) : null}
            </form>
          ) : (
            <div className="mt-6 border border-dashed border-border bg-background p-6 text-sm leading-7 text-foreground-muted">
              Add foods to{" "}
              <Link
                href="/food-library"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Food Library
              </Link>{" "}
              first, then you can pull them straight into this diary snapshot
              with scaled portions.
            </div>
          )
        ) : (
          <form
            onSubmit={handleManualSubmit}
            className="mt-6 border border-border bg-background p-6"
          >
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                Quick add
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Build out today&apos;s diary
              </h3>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-foreground">
                  Food
                </span>
                <input
                  type="text"
                  name="foodName"
                  value={draft.foodName}
                  onChange={(event) =>
                    updateDraft("foodName", event.target.value)
                  }
                  disabled={isDisabled}
                  placeholder="Greek yogurt with berries"
                  className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Calories
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="calories"
                  value={draft.calories}
                  onChange={(event) =>
                    updateDraft("calories", event.target.value)
                  }
                  disabled={isDisabled}
                  placeholder="240"
                  className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Protein (g)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  name="protein"
                  value={draft.protein}
                  onChange={(event) =>
                    updateDraft("protein", event.target.value)
                  }
                  disabled={isDisabled}
                  placeholder="23"
                  className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Carbs (g)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  name="carbs"
                  value={draft.carbs}
                  onChange={(event) => updateDraft("carbs", event.target.value)}
                  disabled={isDisabled}
                  placeholder="18"
                  className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Fat (g)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  name="fat"
                  value={draft.fat}
                  onChange={(event) => updateDraft("fat", event.target.value)}
                  disabled={isDisabled}
                  placeholder="9"
                  className="mt-2 w-full border border-border bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>

            {saveError ? (
              <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isDisabled}
              className="mt-6 bg-brand px-4 py-2 text-sm text-white"
            >
              {isLoading
                ? "Loading..."
                : isPersisting
                  ? "Saving..."
                  : "Add to diary"}
            </button>
          </form>
        )}

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
            Diary snapshot
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Full diary table
          </h2>

          {entries.length === 0 ? (
            <div className="mt-6 border border-dashed border-border bg-background p-6 text-sm leading-7 text-foreground-muted">
              {isLoading
                ? "Your diary entries will appear here once we finish loading your session."
                : canPersist
                  ? "Choose a saved food above and your diary snapshot will start building from there."
                  : "Add your first meal above and the diary will start building a running daily total."}
            </div>
          ) : (
            <DiaryTable
              entries={entries}
              isDisabled={isDisabled}
              onRemove={removeEntry}
            />
          )}
        </div>
      </section>
    </div>
  );
}
