"use client";

import type { FormEvent } from "react";
import { startTransition, useOptimistic, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import type {
  PantryImportDraft,
  PantryImportResponse,
} from "@/app/lib/pantry-label-import";
import {
  addPantryItem,
  deletePantryItem as deleteSavedPantryItem,
  updatePantryItem,
} from "@/app/my-pantry/actions";
import {
  FatBreakdown,
  formatNutritionNumber,
  MacroBreakdown,
  SummaryCard,
} from "@/app/ui/nutrition-display";
import NutritionLabelImporter, {
  type PreparedNutritionLabelImage,
} from "@/app/ui/nutrition-label-importer";
import PantryFoodForm, {
  type PantryFoodDraft,
} from "@/app/ui/pantry-food-form";

type PantryItem = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  servingsPerContainer: number | null;
  lastUsedAt: string | null;
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

const initialDraft = (): PantryFoodDraft => ({
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

function formatServing(item: PantryItem) {
  if (item.servingSize) {
    return item.servingSize;
  }

  if (item.servingsPerContainer) {
    return `${formatNutritionNumber(item.servingsPerContainer)} serving(s)`;
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

function createDraftFromItem(item: PantryItem): PantryFoodDraft {
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
  draft: PantryFoodDraft,
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
    lastUsedAt: null,
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

export default function MyPantryManager({
  canPersist,
  initialItems,
  viewerLabel,
  isLoading = false,
}: MyPantryManagerProps) {
  const router = useRouter();
  const importerRef = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState<PantryFoodDraft>(initialDraft);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPersisting, setIsPersisting] = useState(false);
  const [isAnalyzingLabel, setIsAnalyzingLabel] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">(
    "closed",
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [preparedLabelImage, setPreparedLabelImage] =
    useState<PreparedNutritionLabelImage | null>(null);
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

  function updateDraft<K extends keyof PantryFoodDraft>(
    field: K,
    value: PantryFoodDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetFormState() {
    setDraft(initialDraft());
    setEditingItemId(null);
    setImportError(null);
    setImportWarnings([]);
    setFormMode("closed");
  }

  function openCreateForm() {
    setDraft(initialDraft());
    setEditingItemId(null);
    setImportError(null);
    setImportWarnings([]);
    setFormMode("create");
  }

  function focusImporter() {
    importerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function importPreparedLabel(image: PreparedNutritionLabelImage) {
    const formData = new FormData();
    formData.set("image", image.file);

    const response = await fetch("/api/pantry/import-label", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as
      | PantryImportResponse
      | { error?: string };

    if (!response.ok || !("draft" in payload)) {
      const message =
        "error" in payload && payload.error
          ? payload.error
          : "We couldn't read that label. Please try again.";

      throw new Error(
        message,
      );
    }

    return payload;
  }

  function applyImportedDraft(nextDraft: PantryImportDraft) {
    setDraft(nextDraft);
    setEditingItemId(null);
    setFormMode("create");
  }

  async function handlePreparedLabelImage(image: PreparedNutritionLabelImage) {
    setPreparedLabelImage(image);
    setSaveError(null);
    setImportError(null);
    setImportWarnings([]);
    setIsAnalyzingLabel(true);

    try {
      const response = await importPreparedLabel(image);
      applyImportedDraft(response.draft);
      setImportWarnings(response.warnings);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "We couldn't read that label. Please try again.",
      );
      setFormMode("closed");
    } finally {
      setIsAnalyzingLabel(false);
    }
  }

  function openEditForm(item: PantryItem) {
    setDraft(createDraftFromItem(item));
    setEditingItemId(item.id);
    setImportError(null);
    setImportWarnings([]);
    setFormMode("edit");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isDisabled || isAnalyzingLabel) {
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
    if (isDisabled || isAnalyzingLabel) {
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
      <div className="border border-border bg-surface p-6">
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
        className={`border border-border bg-surface p-6 ${isLoading ? "opacity-60" : ""}`}
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
                  className="mt-2 w-full border border-border bg-surface-elevated px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              disabled={!canPersist || isLoading}
              className="border border-border px-4 py-2 text-sm"
            >
              Manual entry
            </button>
            <button
              type="button"
              onClick={focusImporter}
              disabled={!canPersist || isLoading}
              className="bg-brand px-4 py-2 text-sm text-white"
            >
              Import label
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

        <section ref={importerRef} className="mt-6">
          <NutritionLabelImporter
            disabled={
              !canPersist || isLoading || isPersisting || isAnalyzingLabel
            }
            onPrepared={handlePreparedLabelImage}
          />
        </section>

        {preparedLabelImage ? (
          <div className="mt-6 border border-border bg-background p-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground-muted">
              Prepared image
            </p>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
              <NextImage
                src={preparedLabelImage.previewUrl}
                alt="Prepared nutrition label crop"
                width={preparedLabelImage.width}
                height={preparedLabelImage.height}
                unoptimized
                className="w-full max-w-sm border border-border object-contain"
              />
              <div className="space-y-2 text-sm leading-7 text-foreground-muted">
                <p>{preparedLabelImage.file.name}</p>
                <p>
                  {preparedLabelImage.width} x {preparedLabelImage.height}
                </p>
                <p>
                  {formatNutritionNumber(preparedLabelImage.sizeBytes / 1024)}{" "}
                  KB
                </p>
                <p>{preparedLabelImage.mimeType}</p>
                <p>
                  {isAnalyzingLabel
                    ? "Reading the label and building a draft..."
                    : "This image has been prepared for label extraction."}
                </p>
              </div>
            </div>
            {importError ? (
              <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {importError}
              </p>
            ) : null}
          </div>
        ) : null}

        {isFormOpen ? (
          <div className="mt-6 border border-border bg-background p-6">
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
                  className="border border-border px-3 py-2 text-xs"
                >
                  Close
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {isAnalyzingLabel ? (
                <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground-muted">
                  We are reading the prepared label and pre-filling the pantry
                  form now.
                </div>
              ) : null}

              {importWarnings.length > 0 ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {importWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}

              <PantryFoodForm
                draft={draft}
                disabled={isDisabled || isAnalyzingLabel}
                onChange={updateDraft}
              />

              {saveError ? (
                <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isDisabled || isAnalyzingLabel}
                  className="bg-brand px-4 py-2 text-sm text-white"
                >
                  {isAnalyzingLabel
                    ? "Reading label..."
                    : isPersisting
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
                  className="border border-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-6 border border-dashed border-border bg-background p-6 text-sm leading-7 text-foreground-muted">
            {canPersist
              ? "Use Import label to prepare an image for AI extraction, choose Manual entry to type one in yourself, or click any catalogue row to update an existing food."
              : "Sign in to open the pantry form and start building your own food database."}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="mt-6 border border-dashed border-border bg-background p-6 text-sm leading-7 text-foreground-muted">
            {items.length === 0
              ? "No foods in your catalogue yet. Add a new item when you are ready to start building your pantry database."
              : "No foods match that search right now."}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto border border-border">
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
              <tbody className="divide-y divide-border bg-surface">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={isDisabled || isAnalyzingLabel}
                          aria-label={`Delete ${item.name}`}
                          className="mt-0.5 p-1.5 text-foreground-muted"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          disabled={!canPersist || isLoading || isAnalyzingLabel}
                          aria-label={`Edit ${item.name}${item.brand ? ` ${item.brand}` : ""}`}
                          className="min-w-0 text-left"
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
                      {formatNutritionNumber(item.protein)}g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
