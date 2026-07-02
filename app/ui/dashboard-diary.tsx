"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  addDailyEntry,
  clearDailyEntries as clearSavedDailyEntries,
  deleteDailyEntry as deleteSavedDailyEntry,
} from "@/app/dashboard/actions";

type DashboardDiaryProps = {
  canPersist: boolean;
  initialEntries: DiaryEntry[];
  viewerLabel: string;
};

type DiaryEntry = {
  id: string;
  entryDate: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type DraftEntry = {
  entryDate: string;
  foodName: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

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
    const parsed = JSON.parse(savedEntries) as DiaryEntry[];
    lastStoredEntriesRaw = savedEntries;
    lastStoredEntriesSnapshot = Array.isArray(parsed) ? parsed : EMPTY_ENTRIES;
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

function formatMacro(value: number) {
  return value % 1 === 0 ? `${value}` : value.toFixed(1);
}

export default function DashboardDiary({
  canPersist,
  initialEntries,
  viewerLabel,
}: DashboardDiaryProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftEntry>(initialDraft);
  const [isPersisting, setIsPersisting] = useState(false);
  const anonymousEntries = useSyncExternalStore(
    subscribeToAnonymousEntries,
    readAnonymousEntries,
    () => EMPTY_ENTRIES,
  );
  const entries = canPersist ? initialEntries : anonymousEntries;
  const statusCopy = canPersist
    ? "These entries are loading from your saved diary. Browser-only drafts are ignored until we add an explicit import flow."
    : "These entries live only in this browser for now. Sign in when you are ready to save your diary to your account.";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const foodName = draft.foodName.trim();
    if (!foodName) {
      return;
    }

    const nextEntry: DiaryEntry = {
      id: crypto.randomUUID(),
      entryDate: draft.entryDate,
      foodName,
      calories: Math.max(0, Math.round(parseNumber(draft.calories))),
      protein: Math.max(0, parseNumber(draft.protein)),
      carbs: Math.max(0, parseNumber(draft.carbs)),
      fat: Math.max(0, parseNumber(draft.fat)),
    };

    if (canPersist) {
      setIsPersisting(true);

      try {
        await addDailyEntry({
          entryDate: nextEntry.entryDate,
          foodName: nextEntry.foodName,
          calories: nextEntry.calories,
          protein: nextEntry.protein,
          carbs: nextEntry.carbs,
          fat: nextEntry.fat,
        });
        resetDraftKeepingDate(setDraft);
        router.refresh();
      } finally {
        setIsPersisting(false);
      }

      return;
    }

    writeAnonymousEntries([nextEntry, ...anonymousEntries]);
    resetDraftKeepingDate(setDraft);
  }

  async function removeEntry(entryId: string) {
    if (canPersist) {
      setIsPersisting(true);

      try {
        await deleteSavedDailyEntry(entryId);
        router.refresh();
      } finally {
        setIsPersisting(false);
      }

      return;
    }

    writeAnonymousEntries(
      anonymousEntries.filter((entry) => entry.id !== entryId),
    );
  }

  async function clearEntries() {
    if (canPersist) {
      setIsPersisting(true);

      try {
        await clearSavedDailyEntries();
        router.refresh();
      } finally {
        setIsPersisting(false);
      }

      return;
    }

    writeAnonymousEntries([]);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
          {canPersist ? "Signed-in preview" : "Try the flow"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {canPersist
            ? `Welcome back, ${viewerLabel}.`
            : "You can log food before creating an account."}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted">
          {statusCopy}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                Add an entry
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Build out today&apos;s diary
              </h2>
            </div>
            {entries.length > 0 ? (
              <button
                type="button"
                onClick={clearEntries}
                disabled={isPersisting}
                className="rounded-2xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Date</span>
              <input
                type="date"
                name="entryDate"
                value={draft.entryDate}
                onChange={(event) =>
                  updateDraft("entryDate", event.target.value)
                }
                disabled={isPersisting}
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-foreground">Food</span>
              <input
                type="text"
                name="foodName"
                value={draft.foodName}
                onChange={(event) =>
                  updateDraft("foodName", event.target.value)
                }
                disabled={isPersisting}
                placeholder="Greek yogurt with berries"
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
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
                disabled={isPersisting}
                placeholder="240"
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
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
                onChange={(event) => updateDraft("protein", event.target.value)}
                disabled={isPersisting}
                placeholder="23"
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
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
                disabled={isPersisting}
                placeholder="18"
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
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
                disabled={isPersisting}
                placeholder="9"
                className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPersisting}
            className="mt-6 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {isPersisting ? "Saving..." : "Add to diary"}
          </button>
        </form>

        <section className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
            Today&apos;s entries
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Diary snapshot
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Calories" value={`${totals.calories}`} />
            <SummaryCard
              label="Protein"
              value={`${formatMacro(totals.protein)}g`}
            />
            <SummaryCard
              label="Carbs"
              value={`${formatMacro(totals.carbs)}g`}
            />
            <SummaryCard label="Fat" value={`${formatMacro(totals.fat)}g`} />
          </div>

          {entries.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm leading-7 text-foreground-muted">
              Add your first meal above and the dashboard will start building a
              running daily total.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-surface">
                    <tr className="text-left text-foreground-muted">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Food</th>
                      <th className="px-4 py-3 font-medium">Calories</th>
                      <th className="px-4 py-3 font-medium">Protein</th>
                      <th className="px-4 py-3 font-medium">Carbs</th>
                      <th className="px-4 py-3 font-medium">Fat</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface-elevated">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3">{entry.entryDate}</td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {entry.foodName}
                        </td>
                        <td className="px-4 py-3">{entry.calories}</td>
                        <td className="px-4 py-3">
                          {formatMacro(entry.protein)}g
                        </td>
                        <td className="px-4 py-3">
                          {formatMacro(entry.carbs)}g
                        </td>
                        <td className="px-4 py-3">{formatMacro(entry.fat)}g</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            disabled={isPersisting}
                            className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface"
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
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
