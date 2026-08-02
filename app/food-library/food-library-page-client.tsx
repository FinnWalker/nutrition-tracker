"use client";

import Fuse from "fuse.js";
import type { FormEvent } from "react";
import {
  startTransition,
  useDeferredValue,
  useId,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Ellipsis,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deleteSavedFood, updateSavedFood } from "@/app/food-library/actions";
import {
  getMacroCalorieEstimate,
  getMacroCalorieWarning,
  parseNutritionNumber,
} from "@/app/lib/nutrition-validation";
import FoodLibraryForm, {
  type FoodLibraryDraft,
} from "@/app/ui/food-library-form";
import { SummaryCard, formatNutritionNumber } from "@/app/ui/nutrition-display";

type FoodLibraryItem = {
  id: string;
  name: string;
  brand: string | null;
  serving: string | null;
  servingsPerContainer: number | null;
  calories: number;
  saturatedFat: number;
  transFat: number;
  polyunsaturatedFat: number;
  monounsaturatedFat: number;
  cholesterolMg: number;
  sodiumMg: number;
  protein: number;
  carbs: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars: number;
  fat: number;
  vitaminDMcg: number;
  calciumMg: number;
  ironMg: number;
  potassiumMg: number;
};

type FoodFilter = {
  label: string;
  count: number;
};

type FoodLibraryPageClientProps = {
  canBrowse: boolean;
  items: FoodLibraryItem[];
};

const placeholderFilters = [
  "Meals",
  "Snacks",
  "Ingredients",
  "Drinks",
  "Supplements",
] as const;

export default function FoodLibraryPageClient({
  canBrowse,
  items,
}: FoodLibraryPageClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FoodLibraryDraft | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const mobileFilterId = useId();
  const deferredQuery = useDeferredValue(query);
  const searchTerm = deferredQuery.trim();
  const [optimisticItems, applyOptimisticItems] = useOptimistic(
    items,
    applyFoodLibraryMutation,
  );

  const filters: FoodFilter[] = [
    { label: "All", count: optimisticItems.length },
    ...placeholderFilters.map((label) => ({ label, count: 0 })),
  ];

  const visibleItems = useMemo(
    () =>
      selectedFilter === "All"
        ? searchTerm
          ? searchTerm.length === 1
            ? getSingleCharacterMatches(optimisticItems, searchTerm)
            : new Fuse(optimisticItems, {
                threshold: 0.6,
                ignoreLocation: true,
                keys: [
                  { name: "name", weight: 0.7 },
                  { name: "brand", weight: 0.2 },
                  { name: "serving", weight: 0.1 },
                ],
              })
                .search(searchTerm)
                .map((result) => result.item)
          : optimisticItems
        : [],
    [optimisticItems, searchTerm, selectedFilter],
  );
  const nutritionSnapshot = useMemo(
    () => (draft ? getNutritionSnapshot(draft) : null),
    [draft],
  );

  function updateDraft(field: keyof FoodLibraryDraft, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function openEdit(item: FoodLibraryItem) {
    setEditingItemId(item.id);
    setDraft(createDraftFromItem(item));
    setOpenMenuId(null);
    setSaveError(null);
  }

  function closeEdit() {
    setEditingItemId(null);
    setDraft(null);
    setSaveError(null);
  }

  async function handleDelete(itemId: string) {
    if (!canBrowse || isPersisting) {
      return;
    }

    setOpenMenuId(null);
    setIsPersisting(true);

    startTransition(async () => {
      applyOptimisticItems({
        type: "remove",
        itemId,
      });

      try {
        await deleteSavedFood(itemId);
        if (editingItemId === itemId) {
          closeEdit();
        }
        router.refresh();
      } catch {
        router.refresh();
      } finally {
        setIsPersisting(false);
      }
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingItemId || !draft || isPersisting) {
      return;
    }

    const nextItem = createItemFromDraft(draft, editingItemId);

    setIsPersisting(true);
    setSaveError(null);

    startTransition(async () => {
      applyOptimisticItems({
        type: "update",
        item: nextItem,
      });

      try {
        await updateSavedFood(editingItemId, createSavedFoodInput(draft));
        closeEdit();
        router.refresh();
      } catch (error) {
        router.refresh();
        setSaveError(
          error instanceof Error
            ? error.message
            : "We couldn't save that food. Please try again.",
        );
      } finally {
        setIsPersisting(false);
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl">
      <section className="space-y-5 lg:space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          Food Library
        </h1>

        <div className="space-y-3 lg:hidden">
          <label className="relative block flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-foreground-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search foods..."
              className="h-11 w-full rounded-xl border border-border bg-white px-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand"
            />
          </label>

          <div className="max-w-[12rem]">
            <FilterSelect
              id={mobileFilterId}
              value={selectedFilter}
              onChange={setSelectedFilter}
              options={filters}
            />
          </div>
        </div>

        <div className="hidden lg:flex lg:flex-col lg:gap-3 xl:flex-row xl:items-center">
          <label className="relative block flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-foreground-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search foods..."
              className="h-11 w-full rounded-xl border border-border bg-white px-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand"
            />
          </label>

          <div className="flex flex-wrap gap-2.5 xl:w-auto">
            {filters.map((filter) => {
              const isActive = selectedFilter === filter.label;

              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setSelectedFilter(filter.label)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-brand-muted bg-brand-muted text-brand-foreground"
                      : "border-border bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`text-xs font-semibold ${
                      isActive
                        ? "text-brand-foreground/80"
                        : "text-foreground-muted"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white">
          <div className="hidden lg:block">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-border">
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Food
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Calories
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Protein
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Carbs
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Fat
                  </th>
                  <th className="border-b border-border px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="border-b border-border px-5 py-4 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <FoodPlaceholder name={item.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-sm text-foreground-muted">
                            {formatSubtitle(item)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.calories)} kcal
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.protein)}g
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.carbs)}g
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.fat)}g
                    </td>
                    <td className="border-b border-border px-5 py-4 text-right last:border-b-0">
                      <ItemMenu
                        isOpen={openMenuId === item.id}
                        onOpenChange={(isOpen) =>
                          setOpenMenuId(isOpen ? item.id : null)
                        }
                        onEdit={() => openEdit(item)}
                        onDelete={() => void handleDelete(item.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <FoodPlaceholder name={item.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {formatSubtitle(item)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatNumber(item.calories)} kcal
                  </p>
                </div>
                <ItemMenu
                  isOpen={openMenuId === item.id}
                  onOpenChange={(isOpen) =>
                    setOpenMenuId(isOpen ? item.id : null)
                  }
                  onEdit={() => openEdit(item)}
                  onDelete={() => void handleDelete(item.id)}
                />
              </article>
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <EmptyState
              canBrowse={canBrowse}
              hasQuery={searchTerm.length > 0}
            />
          ) : null}
        </div>

        {editingItemId && draft ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
            <div className="max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-[1.75rem] border border-border bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-6 py-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Edit food
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    Update saved food
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl p-2 text-foreground-muted transition-colors hover:bg-surface"
                  aria-label="Close edit food dialog"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]"
              >
                <div className="space-y-5">
                  <FoodLibraryForm
                    draft={draft}
                    disabled={isPersisting}
                    onChange={updateDraft}
                  />

                  {saveError ? (
                    <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {saveError}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isPersisting || !draft.name.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPersisting ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={closeEdit}
                      disabled={isPersisting}
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {nutritionSnapshot ? (
                  <aside className="space-y-5">
                    <div className="rounded-[1.5rem] border border-border bg-surface p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                        Nutrition snapshot
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <SummaryCard
                          label="Calories"
                          value={`${formatNutritionNumber(nutritionSnapshot.calories)} kcal`}
                        />
                        <SummaryCard
                          label="Macro estimate"
                          value={`${formatNutritionNumber(nutritionSnapshot.estimatedCalories)} kcal`}
                        />
                      </div>
                      <div className="mt-5 space-y-4">
                        <MacroBar
                          label="Protein"
                          value={nutritionSnapshot.protein}
                          colorClass="text-emerald-600"
                          fillClass="bg-emerald-500"
                        />
                        <MacroBar
                          label="Carbs"
                          value={nutritionSnapshot.carbs}
                          colorClass="text-sky-600"
                          fillClass="bg-sky-500"
                        />
                        <MacroBar
                          label="Fat"
                          value={nutritionSnapshot.fat}
                          colorClass="text-amber-600"
                          fillClass="bg-amber-500"
                        />
                      </div>
                      <p className="mt-5 text-sm text-foreground-muted">
                        Protein{" "}
                        {formatNutritionNumber(
                          nutritionSnapshot.macroPercentages.protein,
                        )}
                        %, Carbs{" "}
                        {formatNutritionNumber(
                          nutritionSnapshot.macroPercentages.carbs,
                        )}
                        %, Fat{" "}
                        {formatNutritionNumber(
                          nutritionSnapshot.macroPercentages.fat,
                        )}
                        %
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-border bg-surface p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                        Validation
                      </p>

                      {nutritionSnapshot.warnings.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {nutritionSnapshot.warnings.map((warning) => (
                            <div
                              key={warning}
                              className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                            >
                              <AlertTriangle
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              <p>{warning}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {nutritionSnapshot.checks.map((check) => (
                            <div
                              key={check}
                              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                            >
                              <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              <p>{check}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </aside>
                ) : null}
              </form>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

type FoodLibraryMutation =
  | { type: "update"; item: FoodLibraryItem }
  | { type: "remove"; itemId: string };

function applyFoodLibraryMutation(
  currentItems: FoodLibraryItem[],
  mutation: FoodLibraryMutation,
) {
  switch (mutation.type) {
    case "update":
      return currentItems.map((item) =>
        item.id === mutation.item.id ? mutation.item : item,
      );
    case "remove":
      return currentItems.filter((item) => item.id !== mutation.itemId);
    default:
      return currentItems;
  }
}

function ItemMenu({
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open food actions"
        className="rounded-xl p-2 text-foreground-muted transition-colors hover:bg-surface"
        onClick={() => onOpenChange(!isOpen)}
      >
        <Ellipsis className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-36 rounded-[1.1rem] border border-border bg-white p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface"
            onClick={onEdit}
          >
            <Pencil
              className="h-4 w-4 text-foreground-muted"
              aria-hidden="true"
            />
            <span>Edit</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FoodFilter[];
}) {
  return (
    <label htmlFor={id} className="relative block min-w-0 xl:min-w-44">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand"
      >
        {options.map((option) => (
          <option key={option.label} value={option.label}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-foreground-muted"
        aria-hidden="true"
      />
    </label>
  );
}

function FoodPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-[4.35rem] w-[4.35rem] shrink-0 items-center justify-center rounded-[1rem] bg-brand-muted text-base font-semibold text-brand-foreground">
      <span aria-hidden="true">{initials || "F"}</span>
    </div>
  );
}

function EmptyState({
  canBrowse,
  hasQuery,
}: {
  canBrowse: boolean;
  hasQuery: boolean;
}) {
  let message = "No foods found.";

  if (!canBrowse) {
    message = "Sign in to view your saved foods.";
  } else if (hasQuery) {
    message = "No foods match that search.";
  } else {
    message = "No foods saved yet. Add one from the navigation to get started.";
  }

  return (
    <div className="px-4 py-10 text-center text-sm font-medium text-foreground-muted lg:px-5">
      {message}
    </div>
  );
}

function formatSubtitle(item: FoodLibraryItem) {
  return item.serving || item.brand || "Serving details unavailable";
}

function formatNumber(value: number) {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return rounded.replace(/\.0$/, "");
}

function MacroBar({
  label,
  value,
  colorClass,
  fillClass,
}: {
  label: string;
  value: number;
  colorClass: string;
  fillClass: string;
}) {
  const clampedWidth = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={`font-semibold ${colorClass}`}>{label}</span>
        <span className="text-foreground">{formatNutritionNumber(value)}g</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
    </div>
  );
}

function createDraftFromItem(item: FoodLibraryItem): FoodLibraryDraft {
  return {
    name: item.name,
    brand: item.brand ?? "",
    servingSize: item.serving ?? "",
    servingsPerContainer:
      item.servingsPerContainer === null ? "" : `${item.servingsPerContainer}`,
    calories: `${item.calories}`,
    totalFat: item.fat === 0 ? "" : `${item.fat}`,
    saturatedFat: item.saturatedFat === 0 ? "" : `${item.saturatedFat}`,
    transFat: item.transFat === 0 ? "" : `${item.transFat}`,
    polyunsaturatedFat:
      item.polyunsaturatedFat === 0 ? "" : `${item.polyunsaturatedFat}`,
    monounsaturatedFat:
      item.monounsaturatedFat === 0 ? "" : `${item.monounsaturatedFat}`,
    cholesterolMg: item.cholesterolMg === 0 ? "" : `${item.cholesterolMg}`,
    sodiumMg: item.sodiumMg === 0 ? "" : `${item.sodiumMg}`,
    totalCarbohydrate: item.carbs === 0 ? "" : `${item.carbs}`,
    dietaryFiber: item.dietaryFiber === 0 ? "" : `${item.dietaryFiber}`,
    totalSugars: item.totalSugars === 0 ? "" : `${item.totalSugars}`,
    addedSugars: item.addedSugars === 0 ? "" : `${item.addedSugars}`,
    protein: item.protein === 0 ? "" : `${item.protein}`,
    vitaminDMcg: item.vitaminDMcg === 0 ? "" : `${item.vitaminDMcg}`,
    calciumMg: item.calciumMg === 0 ? "" : `${item.calciumMg}`,
    ironMg: item.ironMg === 0 ? "" : `${item.ironMg}`,
    potassiumMg: item.potassiumMg === 0 ? "" : `${item.potassiumMg}`,
  };
}

function createSavedFoodInput(draft: FoodLibraryDraft) {
  return {
    name: draft.name.trim(),
    brand: draft.brand.trim() || undefined,
    servingSize: draft.servingSize.trim() || undefined,
    servingsPerContainer: draft.servingsPerContainer.trim()
      ? Math.max(0, parseNutritionNumber(draft.servingsPerContainer))
      : undefined,
    calories: Math.max(0, parseNutritionNumber(draft.calories)),
    totalFat: Math.max(0, parseNutritionNumber(draft.totalFat)),
    saturatedFat: Math.max(0, parseNutritionNumber(draft.saturatedFat)),
    transFat: Math.max(0, parseNutritionNumber(draft.transFat)),
    polyunsaturatedFat: Math.max(
      0,
      parseNutritionNumber(draft.polyunsaturatedFat),
    ),
    monounsaturatedFat: Math.max(
      0,
      parseNutritionNumber(draft.monounsaturatedFat),
    ),
    cholesterolMg: Math.max(0, parseNutritionNumber(draft.cholesterolMg)),
    sodiumMg: Math.max(0, parseNutritionNumber(draft.sodiumMg)),
    totalCarbohydrate: Math.max(
      0,
      parseNutritionNumber(draft.totalCarbohydrate),
    ),
    dietaryFiber: Math.max(0, parseNutritionNumber(draft.dietaryFiber)),
    totalSugars: Math.max(0, parseNutritionNumber(draft.totalSugars)),
    addedSugars: Math.max(0, parseNutritionNumber(draft.addedSugars)),
    protein: Math.max(0, parseNutritionNumber(draft.protein)),
    vitaminDMcg: Math.max(0, parseNutritionNumber(draft.vitaminDMcg)),
    calciumMg: Math.max(0, parseNutritionNumber(draft.calciumMg)),
    ironMg: Math.max(0, parseNutritionNumber(draft.ironMg)),
    potassiumMg: Math.max(0, parseNutritionNumber(draft.potassiumMg)),
  };
}

function createItemFromDraft(
  draft: FoodLibraryDraft,
  itemId: string,
): FoodLibraryItem {
  return {
    id: itemId,
    name: draft.name.trim(),
    brand: draft.brand.trim() || null,
    serving: draft.servingSize.trim() || null,
    servingsPerContainer: draft.servingsPerContainer.trim()
      ? Math.max(0, parseNutritionNumber(draft.servingsPerContainer))
      : null,
    calories: Math.max(0, parseNutritionNumber(draft.calories)),
    saturatedFat: Math.max(0, parseNutritionNumber(draft.saturatedFat)),
    transFat: Math.max(0, parseNutritionNumber(draft.transFat)),
    polyunsaturatedFat: Math.max(
      0,
      parseNutritionNumber(draft.polyunsaturatedFat),
    ),
    monounsaturatedFat: Math.max(
      0,
      parseNutritionNumber(draft.monounsaturatedFat),
    ),
    cholesterolMg: Math.max(0, parseNutritionNumber(draft.cholesterolMg)),
    sodiumMg: Math.max(0, parseNutritionNumber(draft.sodiumMg)),
    protein: Math.max(0, parseNutritionNumber(draft.protein)),
    carbs: Math.max(0, parseNutritionNumber(draft.totalCarbohydrate)),
    dietaryFiber: Math.max(0, parseNutritionNumber(draft.dietaryFiber)),
    totalSugars: Math.max(0, parseNutritionNumber(draft.totalSugars)),
    addedSugars: Math.max(0, parseNutritionNumber(draft.addedSugars)),
    fat: Math.max(0, parseNutritionNumber(draft.totalFat)),
    vitaminDMcg: Math.max(0, parseNutritionNumber(draft.vitaminDMcg)),
    calciumMg: Math.max(0, parseNutritionNumber(draft.calciumMg)),
    ironMg: Math.max(0, parseNutritionNumber(draft.ironMg)),
    potassiumMg: Math.max(0, parseNutritionNumber(draft.potassiumMg)),
  };
}

function getSingleCharacterMatches(
  items: FoodLibraryItem[],
  searchTerm: string,
) {
  const normalizedSearchTerm = searchTerm.toLowerCase();

  return items
    .filter((item) => {
      const searchableText = [
        item.name,
        item.brand ?? "",
        item.serving ?? "",
      ].join(" ");

      return searchableText.toLowerCase().includes(normalizedSearchTerm);
    })
    .sort((leftItem, rightItem) => {
      const leftNameStartsWithSearch = leftItem.name
        .toLowerCase()
        .startsWith(normalizedSearchTerm);
      const rightNameStartsWithSearch = rightItem.name
        .toLowerCase()
        .startsWith(normalizedSearchTerm);

      if (leftNameStartsWithSearch !== rightNameStartsWithSearch) {
        return leftNameStartsWithSearch ? -1 : 1;
      }

      return leftItem.name.localeCompare(rightItem.name);
    });
}

function getNutritionSnapshot(draft: FoodLibraryDraft) {
  const calories = parseNutritionNumber(draft.calories);
  const protein = parseNutritionNumber(draft.protein);
  const carbs = parseNutritionNumber(draft.totalCarbohydrate);
  const fat = parseNutritionNumber(draft.totalFat);
  const { estimatedCalories } = getMacroCalorieEstimate({
    calories,
    protein,
    carbs,
    fat,
  });
  const totalMacros = protein + carbs + fat;
  const macroPercentBase = totalMacros > 0 ? totalMacros : 1;

  const warnings: string[] = [];

  if (!draft.name.trim()) {
    warnings.push("Add a product name so this food is easy to find later.");
  }

  const macroCalorieWarning = getMacroCalorieWarning({
    calories,
    protein,
    carbs,
    fat,
  });

  if (macroCalorieWarning) {
    warnings.push(macroCalorieWarning);
  }

  if (
    parseNutritionNumber(draft.addedSugars) >
      parseNutritionNumber(draft.totalSugars) &&
    parseNutritionNumber(draft.totalSugars) > 0
  ) {
    warnings.push("Added sugars should not be greater than total sugars.");
  }

  if (
    parseNutritionNumber(draft.dietaryFiber) >
      parseNutritionNumber(draft.totalCarbohydrate) &&
    parseNutritionNumber(draft.totalCarbohydrate) > 0
  ) {
    warnings.push(
      "Dietary fiber should not be greater than total carbohydrate.",
    );
  }

  const checks =
    warnings.length === 0
      ? [
          "Calories and macros look internally consistent.",
          "This entry is ready to save.",
        ]
      : [];

  return {
    calories,
    protein,
    carbs,
    fat,
    estimatedCalories,
    macroPercentages: {
      protein: (protein / macroPercentBase) * 100,
      carbs: (carbs / macroPercentBase) * 100,
      fat: (fat / macroPercentBase) * 100,
    },
    warnings,
    checks,
  };
}
