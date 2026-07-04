"use client";

import type { FormEvent, ReactNode } from "react";
import { startTransition, useOptimistic, useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  addPantryItem,
  deletePantryItem as deleteSavedPantryItem,
  updatePantryItem,
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
  | { type: "add"; item: PantryItem }
  | { type: "update"; item: PantryItem }
  | { type: "remove"; itemId: string };

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

function formatServing(item: PantryItem) {
  if (item.servingSize) {
    return item.servingSize;
  }

  if (item.servingsPerContainer) {
    return `${formatNumber(item.servingsPerContainer)} serving(s)`;
  }

  return "Not set";
}

function applyPantryMutation(
  currentItems: PantryItem[],
  mutation: PantryMutation,
) {
  switch (mutation.type) {
    case "add":
      return [mutation.item, ...currentItems];
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

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function createDraftFromItem(item: PantryItem): PantryDraft {
  return {
    name: item.name,
    brand: item.brand ?? "",
    servingSize: item.servingSize ?? "",
    servingsPerContainer:
      item.servingsPerContainer === null ? "" : `${item.servingsPerContainer}`,
    calories: `${item.calories}`,
    totalFat: item.totalFat === 0 ? "" : `${item.totalFat}`,
    saturatedFat: item.saturatedFat === 0 ? "" : `${item.saturatedFat}`,
    transFat: item.transFat === 0 ? "" : `${item.transFat}`,
    polyunsaturatedFat:
      item.polyunsaturatedFat === 0 ? "" : `${item.polyunsaturatedFat}`,
    monounsaturatedFat:
      item.monounsaturatedFat === 0 ? "" : `${item.monounsaturatedFat}`,
    cholesterolMg: item.cholesterolMg === 0 ? "" : `${item.cholesterolMg}`,
    sodiumMg: item.sodiumMg === 0 ? "" : `${item.sodiumMg}`,
    totalCarbohydrate:
      item.totalCarbohydrate === 0 ? "" : `${item.totalCarbohydrate}`,
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

function createItemFromDraft(
  draft: PantryDraft,
  itemId = crypto.randomUUID(),
): PantryItem {
  return {
    id: itemId,
    name: draft.name.trim(),
    brand: draft.brand.trim() || null,
    servingSize: draft.servingSize.trim() || null,
    servingsPerContainer: draft.servingsPerContainer.trim()
      ? Math.max(0, parseNumber(draft.servingsPerContainer))
      : null,
    calories: Math.max(0, parseNumber(draft.calories)),
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
}

function NutritionNumberRow({
  label,
  name,
  value,
  placeholder,
  disabled,
  onChange,
  indent = false,
  border = true,
  inputClassName,
}: {
  label: string;
  name: keyof PantryDraft;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (field: keyof PantryDraft, value: string) => void;
  indent?: boolean;
  border?: boolean;
  inputClassName?: string;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 py-2 ${border ? "border-b border-border" : ""}`}
    >
      <span
        className={`text-sm ${indent ? "pl-4 text-foreground-muted" : "font-medium text-foreground"}`}
      >
        {label}
      </span>
      <input
        type="number"
        step="any"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-24 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-right text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName ?? ""}`}
      />
    </label>
  );
}

function NutritionTextRow({
  label,
  name,
  value,
  placeholder,
  disabled,
  onChange,
  border = true,
  inputClassName,
  required = false,
}: {
  label: string;
  name: keyof PantryDraft;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (field: keyof PantryDraft, value: string) => void;
  border?: boolean;
  inputClassName?: string;
  required?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 py-2 ${border ? "border-b border-border" : ""}`}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className={`w-32 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-right text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName ?? ""}`}
      />
    </label>
  );
}

function LabelSection({
  title,
  detailToggle,
  children,
}: {
  title: string;
  detailToggle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t-4 border-foreground pt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </p>
        {detailToggle}
      </div>
      <div className="mt-2">{children}</div>
    </section>
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
  const [showCarbDetails, setShowCarbDetails] = useState(false);
  const [showFatDetails, setShowFatDetails] = useState(false);
  const [showMicroDetails, setShowMicroDetails] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">(
    "closed",
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [optimisticItems, applyOptimisticMutation] = useOptimistic(
    initialItems,
    applyPantryMutation,
  );

  const items = isLoading ? [] : optimisticItems;
  const searchTerm = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const haystack = [
      item.name,
      item.brand ?? "",
      item.servingSize ?? "",
      `${item.calories}`,
    ].join(" ");

    return haystack.toLowerCase().includes(searchTerm);
  });
  const isDisabled = isLoading || isPersisting || !canPersist;
  const isFormOpen = formMode !== "closed";
  const statusCopy = isLoading
    ? "We are checking your pantry access."
    : canPersist
      ? `Your pantry belongs to ${viewerLabel}. Search it like a personal food database, then add or update foods only when you need to.`
      : "Sign in to build a personal food catalogue that you can search while logging your diary.";

  function updateDraft<K extends keyof PantryDraft>(
    field: K,
    value: PantryDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetFormState() {
    setDraft(initialDraft());
    setEditingItemId(null);
    setFormMode("closed");
    setShowCarbDetails(false);
    setShowFatDetails(false);
    setShowMicroDetails(false);
  }

  function openCreateForm() {
    setDraft(initialDraft());
    setEditingItemId(null);
    setFormMode("create");
    setShowCarbDetails(false);
    setShowFatDetails(false);
    setShowMicroDetails(false);
  }

  function openEditForm(item: PantryItem) {
    setDraft(createDraftFromItem(item));
    setEditingItemId(item.id);
    setFormMode("edit");
    setShowCarbDetails(
      item.dietaryFiber > 0 || item.totalSugars > 0 || item.addedSugars > 0,
    );
    setShowFatDetails(
      item.saturatedFat > 0 ||
        item.transFat > 0 ||
        item.polyunsaturatedFat > 0 ||
        item.monounsaturatedFat > 0 ||
        item.cholesterolMg > 0,
    );
    setShowMicroDetails(
      item.vitaminDMcg > 0 ||
        item.calciumMg > 0 ||
        item.ironMg > 0 ||
        item.potassiumMg > 0,
    );
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

    const nextItem = createItemFromDraft(draft, editingItemId ?? undefined);
    const draftSnapshot = draft;
    const editingItem = editingItemId
      ? (items.find((item) => item.id === editingItemId) ?? null)
      : null;

    setIsPersisting(true);
    setSaveError(null);

    startTransition(async () => {
      if (formMode === "edit") {
        applyOptimisticMutation({
          type: "update",
          item: nextItem,
        });
      } else {
        applyOptimisticMutation({
          type: "add",
          item: nextItem,
        });
      }

      try {
        if (formMode === "edit" && editingItemId) {
          await updatePantryItem(editingItemId, {
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
        } else {
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
        }

        resetFormState();
        router.refresh();
      } catch {
        if (formMode === "edit" && editingItem) {
          applyOptimisticMutation({
            type: "update",
            item: editingItem,
          });
        }

        if (formMode === "create") {
          applyOptimisticMutation({
            type: "remove",
            itemId: nextItem.id,
          });
        }

        setDraft(draftSnapshot);
        setFormMode(editingItemId ? "edit" : "create");
        setSaveError(
          formMode === "edit"
            ? "We couldn't save those changes. Please try again."
            : "We couldn't save that pantry item. Please try again.",
        );
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

        if (editingItemId === itemId) {
          resetFormState();
        }

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
              ? "Food catalogue"
              : "Sign in required"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {isLoading
            ? "Preparing your catalogue."
            : canPersist
              ? "Search your personal food database."
              : "Create an account to save pantry foods."}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted">
          {statusCopy}
        </p>
      </div>

      <section
        className={`rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft ${isLoading ? "opacity-60" : ""}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
              Catalogue
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Browse saved foods
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <div className="w-full sm:min-w-64">
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Search
                </span>
                <input
                  type="search"
                  name="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search foods, brands, or calories"
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              disabled={!canPersist || isLoading}
              className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add food
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
          <SummaryCard label="Foods saved" value={`${items.length}`} />
          <SummaryCard
            label="Search results"
            value={`${filteredItems.length}`}
          />
        </div>

        {isFormOpen ? (
          <div className="mt-6 rounded-3xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
                  {formMode === "edit" ? "Edit food" : "New food"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  {formMode === "edit"
                    ? "Update this pantry item"
                    : "Add to your catalogue"}
                </h2>
              </div>
              {isFormOpen ? (
                <button
                  type="button"
                  onClick={resetFormState}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Close
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="rounded-2xl border-2 border-foreground bg-background px-4 py-4">
                <div className="border-b-4 border-foreground pb-3">
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    Nutrition Facts
                  </h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Compact entry for your pantry database.
                  </p>
                </div>

                <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                  <div className="space-y-4">
                    <LabelSection title="Product">
                      <NutritionTextRow
                        label="Name"
                        name="name"
                        value={draft.name}
                        placeholder="Greek yogurt"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        inputClassName="w-52"
                        required
                      />
                      <NutritionTextRow
                        label="Brand"
                        name="brand"
                        value={draft.brand}
                        placeholder="Fage"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        inputClassName="w-40"
                      />
                      <NutritionNumberRow
                        label="Servings per container"
                        name="servingsPerContainer"
                        value={draft.servingsPerContainer}
                        placeholder="1"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        border={false}
                      />
                    </LabelSection>

                    <LabelSection
                      title="Carbs"
                      detailToggle={
                        <button
                          type="button"
                          onClick={() =>
                            setShowCarbDetails((current) => !current)
                          }
                          className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-elevated"
                          aria-expanded={showCarbDetails}
                        >
                          {showCarbDetails ? "Less" : "More"}
                        </button>
                      }
                    >
                      <NutritionNumberRow
                        label="Total carbohydrate (g)"
                        name="totalCarbohydrate"
                        value={draft.totalCarbohydrate}
                        placeholder="6"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        border={!showCarbDetails}
                      />
                      {showCarbDetails ? (
                        <>
                          <NutritionNumberRow
                            label="Total sugars (g)"
                            name="totalSugars"
                            value={draft.totalSugars}
                            placeholder="5"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            indent
                          />
                          <NutritionNumberRow
                            label="Added sugars (g)"
                            name="addedSugars"
                            value={draft.addedSugars}
                            placeholder="0"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            indent
                            border={false}
                          />
                        </>
                      ) : null}
                    </LabelSection>

                    <LabelSection
                      title="Fat"
                      detailToggle={
                        <button
                          type="button"
                          onClick={() =>
                            setShowFatDetails((current) => !current)
                          }
                          className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-elevated"
                          aria-expanded={showFatDetails}
                        >
                          {showFatDetails ? "Less" : "More"}
                        </button>
                      }
                    >
                      <NutritionNumberRow
                        label="Total fat (g)"
                        name="totalFat"
                        value={draft.totalFat}
                        placeholder="4"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        border={!showFatDetails}
                      />
                      {showFatDetails ? (
                        <>
                          <NutritionNumberRow
                            label="Saturated fat (g)"
                            name="saturatedFat"
                            value={draft.saturatedFat}
                            placeholder="2.5"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            indent
                          />
                          <NutritionNumberRow
                            label="Trans fat (g)"
                            name="transFat"
                            value={draft.transFat}
                            placeholder="0"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            indent
                          />
                          <NutritionNumberRow
                            label="Polyunsaturated fat (g)"
                            name="polyunsaturatedFat"
                            value={draft.polyunsaturatedFat}
                            placeholder="0"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            indent
                          />
                          <NutritionNumberRow
                            label="Monounsaturated fat (g)"
                            name="monounsaturatedFat"
                            value={draft.monounsaturatedFat}
                            placeholder="0"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            indent
                          />
                          <NutritionNumberRow
                            label="Cholesterol (mg)"
                            name="cholesterolMg"
                            value={draft.cholesterolMg}
                            placeholder="15"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            border={false}
                          />
                        </>
                      ) : null}
                    </LabelSection>

                    <LabelSection title="Protein">
                      <NutritionNumberRow
                        label="Protein (g)"
                        name="protein"
                        value={draft.protein}
                        placeholder="15"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        border={false}
                      />
                    </LabelSection>
                  </div>

                  <div className="space-y-4">
                    <LabelSection title="Serving">
                      <NutritionTextRow
                        label="Serving size"
                        name="servingSize"
                        value={draft.servingSize}
                        placeholder="170g tub"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        inputClassName="w-44"
                      />
                      <NutritionNumberRow
                        label="Calories"
                        name="calories"
                        value={draft.calories}
                        placeholder="140"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        border={false}
                      />
                    </LabelSection>

                    <LabelSection
                      title="Micros"
                      detailToggle={
                        <button
                          type="button"
                          onClick={() =>
                            setShowMicroDetails((current) => !current)
                          }
                          className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-elevated"
                          aria-expanded={showMicroDetails}
                        >
                          {showMicroDetails ? "Less" : "More"}
                        </button>
                      }
                    >
                      <NutritionNumberRow
                        label="Sodium (mg)"
                        name="sodiumMg"
                        value={draft.sodiumMg}
                        placeholder="65"
                        disabled={isDisabled}
                        onChange={updateDraft}
                        border={!showMicroDetails}
                      />
                      {showMicroDetails ? (
                        <>
                          <NutritionNumberRow
                            label="Dietary fiber (g)"
                            name="dietaryFiber"
                            value={draft.dietaryFiber}
                            placeholder="0"
                            disabled={isDisabled}
                            onChange={updateDraft}
                          />
                          <NutritionNumberRow
                            label="Vitamin D (mcg)"
                            name="vitaminDMcg"
                            value={draft.vitaminDMcg}
                            placeholder="0"
                            disabled={isDisabled}
                            onChange={updateDraft}
                          />
                          <NutritionNumberRow
                            label="Calcium (mg)"
                            name="calciumMg"
                            value={draft.calciumMg}
                            placeholder="190"
                            disabled={isDisabled}
                            onChange={updateDraft}
                          />
                          <NutritionNumberRow
                            label="Iron (mg)"
                            name="ironMg"
                            value={draft.ironMg}
                            placeholder="0"
                            disabled={isDisabled}
                            onChange={updateDraft}
                          />
                          <NutritionNumberRow
                            label="Potassium (mg)"
                            name="potassiumMg"
                            value={draft.potassiumMg}
                            placeholder="240"
                            disabled={isDisabled}
                            onChange={updateDraft}
                            border={false}
                          />
                        </>
                      ) : null}
                    </LabelSection>
                  </div>
                </div>
              </div>

              {saveError ? (
                <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPersisting
                    ? formMode === "edit"
                      ? "Saving..."
                      : "Adding..."
                    : formMode === "edit"
                      ? "Save changes"
                      : "Add to pantry"}
                </button>
                <button
                  type="button"
                  onClick={resetFormState}
                  className="rounded-2xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm leading-7 text-foreground-muted">
            {canPersist
              ? "Choose Add food to create a new entry, or click any catalogue row to update an existing food."
              : "Sign in to open the pantry form and start building your own food database."}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm leading-7 text-foreground-muted">
            {items.length === 0
              ? "No foods in your catalogue yet. Add a new item when you are ready to start building your pantry database."
              : "No foods match that search right now."}
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
                    <th className="px-4 py-3 font-medium">Fat</th>
                    <th className="px-4 py-3 font-medium">Protein</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface-elevated">
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={isDisabled}
                            aria-label={`Delete ${item.name}`}
                            className="mt-0.5 rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            disabled={!canPersist || isLoading}
                            aria-label={`Edit ${item.name}${item.brand ? ` ${item.brand}` : ""}`}
                            className="min-w-0 text-left transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div className="font-medium text-foreground">
                              {item.name}
                            </div>
                            {item.brand ? (
                              <div className="text-xs text-foreground-muted">
                                {item.brand}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs text-foreground-muted">
                              Updated {formatUpdatedAt(item.updatedAt)}
                            </div>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatServing(item)}</td>
                      <td className="px-4 py-3">{item.calories}</td>
                      <td className="px-4 py-3">
                        <MacroBreakdown
                          total={item.totalCarbohydrate}
                          sugars={item.totalSugars}
                          addedSugars={item.addedSugars}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <FatBreakdown
                          total={item.totalFat}
                          saturatedFat={item.saturatedFat}
                          transFat={item.transFat}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(item.protein)}g
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

function MacroBreakdown({
  total,
  sugars,
  addedSugars,
}: {
  total: number;
  sugars: number;
  addedSugars: number;
}) {
  return (
    <div className="space-y-1">
      <div className="font-medium text-foreground">{formatNumber(total)}g</div>
      {sugars > 0 ? (
        <div className="text-xs text-foreground-muted">
          sugars
          <span className="ml-2">{formatNumber(sugars)}g</span>
        </div>
      ) : null}
      {addedSugars > 0 ? (
        <div className="text-xs text-foreground-muted">
          added sugars
          <span className="ml-2">{formatNumber(addedSugars)}g</span>
        </div>
      ) : null}
    </div>
  );
}

function FatBreakdown({
  total,
  saturatedFat,
  transFat,
}: {
  total: number;
  saturatedFat: number;
  transFat: number;
}) {
  return (
    <div className="space-y-1">
      <div className="font-medium text-foreground">{formatNumber(total)}g</div>
      {saturatedFat > 0 ? (
        <div className="text-xs text-foreground-muted">
          sat fat
          <span className="ml-2">{formatNumber(saturatedFat)}g</span>
        </div>
      ) : null}
      {transFat > 0 ? (
        <div className="text-xs text-foreground-muted">
          trans fat
          <span className="ml-2">{formatNumber(transFat)}g</span>
        </div>
      ) : null}
    </div>
  );
}
