"use client";

import type { FormEvent } from "react";
import { startTransition, useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addPantryItem,
  deletePantryItem as deleteSavedPantryItem,
} from "@/app/my-pantry/actions";

type PantryItem = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  servingsPerContainer: number | null;
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  polyunsaturatedFat: number;
  monounsaturatedFat: number;
  cholesterolMg: number;
  sodiumMg: number;
  totalCarbohydrate: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars: number;
  protein: number;
  vitaminDMcg: number;
  calciumMg: number;
  ironMg: number;
  potassiumMg: number;
  updatedAt: string;
};

type PantryDraft = {
  name: string;
  brand: string;
  servingSize: string;
  servingsPerContainer: string;
  calories: string;
  totalFat: string;
  saturatedFat: string;
  transFat: string;
  polyunsaturatedFat: string;
  monounsaturatedFat: string;
  cholesterolMg: string;
  sodiumMg: string;
  totalCarbohydrate: string;
  dietaryFiber: string;
  totalSugars: string;
  addedSugars: string;
  protein: string;
  vitaminDMcg: string;
  calciumMg: string;
  ironMg: string;
  potassiumMg: string;
};

type PantryMutation =
  { type: "add"; item: PantryItem } | { type: "remove"; itemId: string };

type MyPantryManagerProps = {
  canPersist: boolean;
  initialItems: PantryItem[];
  viewerLabel: string;
  isLoading?: boolean;
};

const initialDraft = (): PantryDraft => ({
  name: "",
  brand: "",
  servingSize: "",
  servingsPerContainer: "",
  calories: "",
  totalFat: "",
  saturatedFat: "",
  transFat: "",
  polyunsaturatedFat: "",
  monounsaturatedFat: "",
  cholesterolMg: "",
  sodiumMg: "",
  totalCarbohydrate: "",
  dietaryFiber: "",
  totalSugars: "",
  addedSugars: "",
  protein: "",
  vitaminDMcg: "",
  calciumMg: "",
  ironMg: "",
  potassiumMg: "",
});

function parseNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  return value % 1 === 0 ? `${value}` : value.toFixed(1);
}

function applyPantryMutation(
  currentItems: PantryItem[],
  mutation: PantryMutation,
) {
  switch (mutation.type) {
    case "add":
      return [mutation.item, ...currentItems];
    case "remove":
      return currentItems.filter((item) => item.id !== mutation.itemId);
    default:
      return currentItems;
  }
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatServing(item: PantryItem) {
  if (item.servingSize) {
    return item.servingSize;
  }

  if (item.servingsPerContainer) {
    return `${formatNumber(item.servingsPerContainer)} serving(s)`;
  }

  return "Not set";
}

function NutritionField({
  label,
  name,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  name: keyof PantryDraft;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (field: keyof PantryDraft, value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        min="0"
        step="0.1"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

export default function MyPantryManager({
  canPersist,
  initialItems,
  viewerLabel,
  isLoading = false,
}: MyPantryManagerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<PantryDraft>(initialDraft);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPersisting, setIsPersisting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [optimisticItems, applyOptimisticMutation] = useOptimistic(
    initialItems,
    applyPantryMutation,
  );

  const items = isLoading ? [] : optimisticItems;
  const searchTerm = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const haystack = `${item.name} ${item.brand ?? ""} ${item.servingSize ?? ""}`;
    return haystack.toLowerCase().includes(searchTerm);
  });
  const isDisabled = isLoading || isPersisting || !canPersist;
  const statusCopy = isLoading
    ? "We are checking your pantry access."
    : canPersist
      ? `Your pantry belongs to ${viewerLabel}. These foods are ready to become the source for diary search next.`
      : "Sign in to start building a pantry that follows you across devices and can be searched while logging diary entries.";

  function updateDraft<K extends keyof PantryDraft>(
    field: K,
    value: PantryDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isDisabled) {
      return;
    }

    const name = draft.name.trim();

    if (!name) {
      return;
    }

    const nextItem: PantryItem = {
      id: crypto.randomUUID(),
      name,
      brand: draft.brand.trim() || null,
      servingSize: draft.servingSize.trim() || null,
      servingsPerContainer: draft.servingsPerContainer.trim()
        ? Math.max(0, parseNumber(draft.servingsPerContainer))
        : null,
      calories: Math.max(0, Math.round(parseNumber(draft.calories))),
      totalFat: Math.max(0, parseNumber(draft.totalFat)),
      saturatedFat: Math.max(0, parseNumber(draft.saturatedFat)),
      transFat: Math.max(0, parseNumber(draft.transFat)),
      polyunsaturatedFat: Math.max(0, parseNumber(draft.polyunsaturatedFat)),
      monounsaturatedFat: Math.max(0, parseNumber(draft.monounsaturatedFat)),
      cholesterolMg: Math.max(0, parseNumber(draft.cholesterolMg)),
      sodiumMg: Math.max(0, parseNumber(draft.sodiumMg)),
      totalCarbohydrate: Math.max(0, parseNumber(draft.totalCarbohydrate)),
      dietaryFiber: Math.max(0, parseNumber(draft.dietaryFiber)),
      totalSugars: Math.max(0, parseNumber(draft.totalSugars)),
      addedSugars: Math.max(0, parseNumber(draft.addedSugars)),
      protein: Math.max(0, parseNumber(draft.protein)),
      vitaminDMcg: Math.max(0, parseNumber(draft.vitaminDMcg)),
      calciumMg: Math.max(0, parseNumber(draft.calciumMg)),
      ironMg: Math.max(0, parseNumber(draft.ironMg)),
      potassiumMg: Math.max(0, parseNumber(draft.potassiumMg)),
      updatedAt: new Date().toISOString(),
    };

    const draftSnapshot = draft;
    const mutation: PantryMutation = {
      type: "add",
      item: nextItem,
    };

    setIsPersisting(true);
    setSaveError(null);
    setDraft(initialDraft());
    startTransition(async () => {
      applyOptimisticMutation(mutation);

      try {
        await addPantryItem({
          name: nextItem.name,
          brand: nextItem.brand ?? undefined,
          servingSize: nextItem.servingSize ?? undefined,
          servingsPerContainer: nextItem.servingsPerContainer ?? undefined,
          calories: nextItem.calories,
          totalFat: nextItem.totalFat,
          saturatedFat: nextItem.saturatedFat,
          transFat: nextItem.transFat,
          polyunsaturatedFat: nextItem.polyunsaturatedFat,
          monounsaturatedFat: nextItem.monounsaturatedFat,
          cholesterolMg: nextItem.cholesterolMg,
          sodiumMg: nextItem.sodiumMg,
          totalCarbohydrate: nextItem.totalCarbohydrate,
          dietaryFiber: nextItem.dietaryFiber,
          totalSugars: nextItem.totalSugars,
          addedSugars: nextItem.addedSugars,
          protein: nextItem.protein,
          vitaminDMcg: nextItem.vitaminDMcg,
          calciumMg: nextItem.calciumMg,
          ironMg: nextItem.ironMg,
          potassiumMg: nextItem.potassiumMg,
        });
        router.refresh();
      } catch {
        setDraft(draftSnapshot);
        setSaveError("We couldn't save that pantry item. Please try again.");
      } finally {
        setIsPersisting(false);
      }
    });
  }

  async function removeItem(itemId: string) {
    if (isDisabled) {
      return;
    }

    const mutation: PantryMutation = { type: "remove", itemId };

    setIsPersisting(true);
    setSaveError(null);
    startTransition(async () => {
      applyOptimisticMutation(mutation);

      try {
        await deleteSavedPantryItem(itemId);
        router.refresh();
      } catch {
        setSaveError("We couldn't remove that pantry item. Please try again.");
      } finally {
        setIsPersisting(false);
      }
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
          {isLoading
            ? "Loading pantry"
            : canPersist
              ? "Personal collection"
              : "Sign in required"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {isLoading
            ? "Preparing your pantry."
            : canPersist
              ? "Build a reusable food library."
              : "Create an account to save pantry foods."}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted">
          {statusCopy}
        </p>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-[2rem] bg-background/35" />
        ) : null}

        <div
          className={`grid gap-6 transition-opacity lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] ${isLoading ? "opacity-60" : "opacity-100"}`}
          aria-busy={isLoading}
        >
          <form
            onSubmit={handleSubmit}
            className={`rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft ${isLoading ? "cursor-wait" : ""}`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
              Add a food
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Save a pantry staple
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-foreground">
                  Name
                </span>
                <input
                  type="text"
                  name="name"
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                  disabled={isDisabled}
                  placeholder="Greek yogurt"
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Brand
                </span>
                <input
                  type="text"
                  name="brand"
                  value={draft.brand}
                  onChange={(event) => updateDraft("brand", event.target.value)}
                  disabled={isDisabled}
                  placeholder="Fage"
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Serving size
                </span>
                <input
                  type="text"
                  name="servingSize"
                  value={draft.servingSize}
                  onChange={(event) =>
                    updateDraft("servingSize", event.target.value)
                  }
                  disabled={isDisabled}
                  placeholder="170g tub"
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <NutritionField
                label="Servings per container"
                name="servingsPerContainer"
                value={draft.servingsPerContainer}
                placeholder="1"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Calories"
                name="calories"
                value={draft.calories}
                placeholder="140"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Total fat (g)"
                name="totalFat"
                value={draft.totalFat}
                placeholder="4"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Saturated fat (g)"
                name="saturatedFat"
                value={draft.saturatedFat}
                placeholder="2.5"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Trans fat (g)"
                name="transFat"
                value={draft.transFat}
                placeholder="0"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Polyunsaturated fat (g)"
                name="polyunsaturatedFat"
                value={draft.polyunsaturatedFat}
                placeholder="0"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Monounsaturated fat (g)"
                name="monounsaturatedFat"
                value={draft.monounsaturatedFat}
                placeholder="0"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Cholesterol (mg)"
                name="cholesterolMg"
                value={draft.cholesterolMg}
                placeholder="15"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Sodium (mg)"
                name="sodiumMg"
                value={draft.sodiumMg}
                placeholder="65"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Total carbohydrate (g)"
                name="totalCarbohydrate"
                value={draft.totalCarbohydrate}
                placeholder="6"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Dietary fiber (g)"
                name="dietaryFiber"
                value={draft.dietaryFiber}
                placeholder="0"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Total sugars (g)"
                name="totalSugars"
                value={draft.totalSugars}
                placeholder="5"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Added sugars (g)"
                name="addedSugars"
                value={draft.addedSugars}
                placeholder="0"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Protein (g)"
                name="protein"
                value={draft.protein}
                placeholder="15"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Vitamin D (mcg)"
                name="vitaminDMcg"
                value={draft.vitaminDMcg}
                placeholder="0"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Calcium (mg)"
                name="calciumMg"
                value={draft.calciumMg}
                placeholder="190"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Iron (mg)"
                name="ironMg"
                value={draft.ironMg}
                placeholder="0"
                disabled={isDisabled}
                onChange={updateDraft}
              />
              <NutritionField
                label="Potassium (mg)"
                name="potassiumMg"
                value={draft.potassiumMg}
                placeholder="240"
                disabled={isDisabled}
                onChange={updateDraft}
              />
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
                  : canPersist
                    ? "Add to pantry"
                    : "Sign in to add foods"}
            </button>
          </form>

          <section
            className={`rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft ${isLoading ? "cursor-wait" : ""}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                  Saved foods
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Search your pantry
                </h2>
              </div>
              <div className="w-full sm:max-w-xs">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Search
                  </span>
                  <input
                    type="search"
                    name="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search name, brand, or serving"
                    className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <SummaryCard label="Items saved" value={`${items.length}`} />
              <SummaryCard
                label="Search results"
                value={`${filteredItems.length}`}
              />
            </div>

            {filteredItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm leading-7 text-foreground-muted">
                {items.length === 0
                  ? "Your pantry is empty right now. Add a few go-to foods and this page will become the source for diary search."
                  : "No pantry items match that search yet."}
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-surface">
                      <tr className="text-left text-foreground-muted">
                        <th className="px-4 py-3 font-medium">Food</th>
                        <th className="px-4 py-3 font-medium">Serving</th>
                        <th className="px-4 py-3 font-medium">Calories</th>
                        <th className="px-4 py-3 font-medium">Carbs</th>
                        <th className="px-4 py-3 font-medium">Sugars</th>
                        <th className="px-4 py-3 font-medium">Fat</th>
                        <th className="px-4 py-3 font-medium">Sat. fat</th>
                        <th className="px-4 py-3 font-medium">Protein</th>
                        <th className="px-4 py-3 font-medium">Updated</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface-elevated">
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {item.name}
                            </div>
                            {item.brand ? (
                              <div className="text-xs text-foreground-muted">
                                {item.brand}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">{formatServing(item)}</td>
                          <td className="px-4 py-3">{item.calories}</td>
                          <td className="px-4 py-3">
                            {formatNumber(item.totalCarbohydrate)}g
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(item.totalSugars)}g
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(item.totalFat)}g
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(item.saturatedFat)}g
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(item.protein)}g
                          </td>
                          <td className="px-4 py-3">
                            {formatUpdatedAt(item.updatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
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
            )}
          </section>
        </div>
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
