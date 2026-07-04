"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import Link from "next/link";
import {
  startTransition,
  useOptimistic,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  addDailyEntry,
  clearDailyEntries as clearSavedDailyEntries,
  deleteDailyEntry as deleteSavedDailyEntry,
} from "@/app/dashboard/actions";
import { formatNutritionNumber, SummaryCard } from "@/app/ui/nutrition-display";

type DashboardDiaryProps = {
  canPersist: boolean;
  initialEntries: DiaryEntry[];
  initialPantryItems: PantryItem[];
  viewerLabel: string;
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

type PantryItem = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
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

const STORAGE_KEY = "nutrition-tracker-dashboard-draft";
const STORAGE_EVENT = "nutrition-tracker-dashboard-storage";
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

function createPantryEntry(
  item: PantryItem,
  entryDate: string,
  portions: number,
): DiaryEntry {
  const label = item.brand ? `${item.name} (${item.brand})` : item.name;

  return {
    id: crypto.randomUUID(),
    entryDate,
    foodName: label,
    servings: roundMacro(portions),
    calories: Math.max(0, Math.round(item.calories * portions)),
    protein: Math.max(0, roundMacro(item.protein * portions)),
    carbs: Math.max(0, roundMacro(item.totalCarbohydrate * portions)),
    fat: Math.max(0, roundMacro(item.totalFat * portions)),
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
    <div className="mt-6 overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-foreground-muted">
              <th className="px-4 py-3 font-medium">Food</th>
              <th className="px-4 py-3 font-medium">Servings</th>
              <th className="px-4 py-3 font-medium">Calories</th>
              <th className="px-4 py-3 font-medium">Carbs</th>
              <th className="px-4 py-3 font-medium">Fat</th>
              <th className="px-4 py-3 font-medium">Protein</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {entry.foodName}
                </td>
                <td className="px-4 py-3">
                  {formatNutritionNumber(entry.servings)}
                </td>
                <td className="px-4 py-3">{entry.calories}</td>
                <td className="px-4 py-3">
                  {formatNutritionNumber(entry.carbs)}g
                </td>
                <td className="px-4 py-3">
                  {formatNutritionNumber(entry.fat)}g
                </td>
                <td className="px-4 py-3">
                  {formatNutritionNumber(entry.protein)}g
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    disabled={isDisabled}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardDiary({
  canPersist,
  initialEntries,
  initialPantryItems,
  viewerLabel,
  isLoading = false,
}: DashboardDiaryProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftEntry>(initialDraft);
  const entryDate = getTodayDateInputValue();
  const [selectedPantryItemId, setSelectedPantryItemId] = useState(
    initialPantryItems[0]?.id ?? "",
  );
  const [portions, setPortions] = useState("1");
  const [isPersisting, setIsPersisting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
  const activePantryItem =
    initialPantryItems.find((item) => item.id === selectedPantryItemId) ??
    initialPantryItems[0] ??
    null;
  const parsedPortions = parseNumber(portions);
  const hasValidPortions = parsedPortions > 0;
  const pantryPreview = activePantryItem
    ? createPantryEntry(
        activePantryItem,
        entryDate,
        Math.max(parsedPortions, 0),
      )
    : null;
  const statusCopy = isLoading
    ? "We are checking whether your diary and pantry are ready."
    : canPersist
      ? `Welcome back, ${viewerLabel}. Pick a saved pantry item, scale the portions, and add it straight into today's diary.`
      : "You can still sketch out diary entries in this browser while you decide whether to create an account.";

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
          calories: nextEntry.calories,
          protein: nextEntry.protein,
          carbs: nextEntry.carbs,
          fat: nextEntry.fat,
        });
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

  async function handlePantrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isDisabled || !activePantryItem || !hasValidPortions || !canPersist) {
      return;
    }

    const nextEntry = createPantryEntry(
      activePantryItem,
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
      <div className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
          {isLoading
            ? "Loading diary"
            : canPersist
              ? "Signed-in diary"
              : "Try the flow"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {isLoading
            ? "Preparing your dashboard."
            : canPersist
              ? "Your daily summary comes first."
              : "You can log food before creating an account."}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted">
          {statusCopy}
        </p>
      </div>

      <section
        className={`rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft transition-opacity ${isLoading ? "opacity-60" : "opacity-100"}`}
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
              className="rounded-2xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
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
          initialPantryItems.length > 0 ? (
            <form
              onSubmit={handlePantrySubmit}
              className="mt-6 rounded-3xl border border-border bg-surface p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                    Add from pantry
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                    Build today&apos;s diary from saved foods
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted">
                    Choose a pantry item, set the number of portions, and we
                    will scale the macros before it lands in the diary snapshot.
                  </p>
                </div>
                {activePantryItem ? (
                  <div className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground-muted">
                    <div className="font-medium text-foreground">
                      {activePantryItem.name}
                    </div>
                    {activePantryItem.brand ? (
                      <div className="mt-1">{activePantryItem.brand}</div>
                    ) : null}
                    {activePantryItem.servingSize ? (
                      <div className="mt-1">
                        Serving: {activePantryItem.servingSize}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
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
                      className="mt-2 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-foreground">
                      Pantry item
                    </span>
                    <select
                      name="pantryItemId"
                      value={activePantryItem?.id ?? ""}
                      onChange={(event) =>
                        setSelectedPantryItemId(event.target.value)
                      }
                      disabled={isDisabled}
                      className="mt-2 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {initialPantryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.brand ? ` - ${item.brand}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="rounded-3xl border border-border bg-surface-elevated p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                    Live preview
                  </p>
                  <h4 className="mt-3 text-xl font-semibold tracking-tight">
                    Scaled nutrition
                  </h4>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <SummaryCard
                      label="Calories"
                      value={`${pantryPreview?.calories ?? 0}`}
                    />
                    <SummaryCard
                      label="Carbs"
                      value={`${formatNutritionNumber(pantryPreview?.carbs ?? 0)}g`}
                    />
                    <SummaryCard
                      label="Fat"
                      value={`${formatNutritionNumber(pantryPreview?.fat ?? 0)}g`}
                    />
                    <SummaryCard
                      label="Protein"
                      value={`${formatNutritionNumber(pantryPreview?.protein ?? 0)}g`}
                    />
                  </div>
                </div>
              </div>

              {saveError ? (
                <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isDisabled || !activePantryItem || !hasValidPortions}
                className="mt-6 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading
                  ? "Loading..."
                  : isPersisting
                    ? "Saving..."
                    : "Add to diary"}
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm leading-7 text-foreground-muted">
              Add foods to{" "}
              <Link
                href="/my-pantry"
                className="font-medium text-foreground underline underline-offset-4"
              >
                My Pantry
              </Link>{" "}
              first, then you can pull them straight into this diary snapshot
              with scaled portions.
            </div>
          )
        ) : (
          <form
            onSubmit={handleManualSubmit}
            className={`mt-6 rounded-3xl border border-border bg-surface p-6 ${isLoading ? "cursor-wait" : ""}`}
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
                  className="mt-2 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="mt-2 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="mt-2 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="mt-2 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="mt-2 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
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
              className="mt-6 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm leading-7 text-foreground-muted">
              {isLoading
                ? "Your diary entries will appear here once we finish loading your session."
                : canPersist
                  ? "Choose a pantry item above and your diary snapshot will start building from there."
                  : "Add your first meal above and the dashboard will start building a running daily total."}
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
