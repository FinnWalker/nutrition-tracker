"use client";

import type { FormEvent } from "react";
import { startTransition, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PantryImportResponse } from "@/app/lib/pantry-label-import";
import { addSavedFood } from "@/app/food-library/actions";
import FoodLibraryForm, {
  type FoodLibraryDraft,
} from "@/app/ui/food-library-form";
import NutritionLabelImporter, {
  type PreparedNutritionLabelImage,
} from "@/app/ui/nutrition-label-importer";
import { SummaryCard, formatNutritionNumber } from "@/app/ui/nutrition-display";

const initialDraft: FoodLibraryDraft = {
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
};

type AddFoodTab = "manual" | "ai";

function parseNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
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

export default function AddFoodPageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AddFoodTab>("manual");
  const [draft, setDraft] = useState<FoodLibraryDraft>(initialDraft);
  const [preparedImage, setPreparedImage] =
    useState<PreparedNutritionLabelImage | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isAnalyzingLabel, setIsAnalyzingLabel] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const nutritionSnapshot = useMemo(() => {
    const calories = parseNumber(draft.calories);
    const protein = parseNumber(draft.protein);
    const carbs = parseNumber(draft.totalCarbohydrate);
    const fat = parseNumber(draft.totalFat);
    const estimatedCalories = protein * 4 + carbs * 4 + fat * 9;
    const calorieGap = Math.round(calories - estimatedCalories);
    const totalMacros = protein + carbs + fat;
    const macroPercentBase = totalMacros > 0 ? totalMacros : 1;

    const warnings: string[] = [];

    if (!draft.name.trim()) {
      warnings.push("Add a product name so this food is easy to find later.");
    }

    if (calories > 0 && Math.abs(calorieGap) > 20) {
      warnings.push(
        `Macro calories estimate ${estimatedCalories} kcal, which is ${Math.abs(calorieGap)} kcal ${calorieGap > 0 ? "below" : "above"} the entered calories.`,
      );
    }

    if (
      parseNumber(draft.addedSugars) > parseNumber(draft.totalSugars) &&
      parseNumber(draft.totalSugars) > 0
    ) {
      warnings.push("Added sugars should not be greater than total sugars.");
    }

    if (
      parseNumber(draft.dietaryFiber) > parseNumber(draft.totalCarbohydrate) &&
      parseNumber(draft.totalCarbohydrate) > 0
    ) {
      warnings.push(
        "Dietary fiber should not be greater than total carbohydrate.",
      );
    }

    const checks =
      warnings.length === 0
        ? [
            "Calories and macros look internally consistent.",
            "This entry is ready to save once you wire up the submit action.",
          ]
        : [];

    return {
      calories,
      protein,
      carbs,
      fat,
      estimatedCalories,
      calorieGap,
      macroPercentages: {
        protein: (protein / macroPercentBase) * 100,
        carbs: (carbs / macroPercentBase) * 100,
        fat: (fat / macroPercentBase) * 100,
      },
      warnings,
      checks,
    };
  }, [draft]);

  function updateDraft(field: keyof FoodLibraryDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetDraft() {
    setDraft(initialDraft);
  }

  function createSavedFoodInput(nextDraft: FoodLibraryDraft) {
    return {
      name: nextDraft.name.trim(),
      brand: nextDraft.brand.trim() || undefined,
      servingSize: nextDraft.servingSize.trim() || undefined,
      servingsPerContainer: nextDraft.servingsPerContainer.trim()
        ? Math.max(0, parseNumber(nextDraft.servingsPerContainer))
        : undefined,
      calories: Math.max(0, parseNumber(nextDraft.calories)),
      totalFat: Math.max(0, parseNumber(nextDraft.totalFat)),
      saturatedFat: Math.max(0, parseNumber(nextDraft.saturatedFat)),
      transFat: Math.max(0, parseNumber(nextDraft.transFat)),
      polyunsaturatedFat: Math.max(0, parseNumber(nextDraft.polyunsaturatedFat)),
      monounsaturatedFat: Math.max(0, parseNumber(nextDraft.monounsaturatedFat)),
      cholesterolMg: Math.max(0, parseNumber(nextDraft.cholesterolMg)),
      sodiumMg: Math.max(0, parseNumber(nextDraft.sodiumMg)),
      totalCarbohydrate: Math.max(0, parseNumber(nextDraft.totalCarbohydrate)),
      dietaryFiber: Math.max(0, parseNumber(nextDraft.dietaryFiber)),
      totalSugars: Math.max(0, parseNumber(nextDraft.totalSugars)),
      addedSugars: Math.max(0, parseNumber(nextDraft.addedSugars)),
      protein: Math.max(0, parseNumber(nextDraft.protein)),
      vitaminDMcg: Math.max(0, parseNumber(nextDraft.vitaminDMcg)),
      calciumMg: Math.max(0, parseNumber(nextDraft.calciumMg)),
      ironMg: Math.max(0, parseNumber(nextDraft.ironMg)),
      potassiumMg: Math.max(0, parseNumber(nextDraft.potassiumMg)),
    };
  }

  async function importPreparedLabel(image: PreparedNutritionLabelImage) {
    const formData = new FormData();
    formData.set("image", image.file);

    const response = await fetch("/api/food-library/import-label", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as
      | PantryImportResponse
      | { error?: string };

    if (!response.ok || !("draft" in payload)) {
      throw new Error(
        "error" in payload && payload.error
          ? payload.error
          : "We couldn't read that label. Please try again.",
      );
    }

    return payload;
  }

  async function handlePreparedLabelImage(image: PreparedNutritionLabelImage) {
    setPreparedImage(image);
    setSaveSuccess(null);
    setSaveError(null);
    setImportError(null);
    setImportWarnings([]);
    setIsAnalyzingLabel(true);

    try {
      const response = await importPreparedLabel(image);
      setDraft(response.draft);
      setImportWarnings(response.warnings);
      setActiveTab("manual");
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "We couldn't read that label. Please try again.",
      );
    } finally {
      setIsAnalyzingLabel(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = draft.name.trim();

    if (!name || isPersisting || isAnalyzingLabel) {
      return;
    }

    setIsPersisting(true);
    setSaveError(null);
    setSaveSuccess(null);

    const draftSnapshot = draft;

    startTransition(async () => {
      try {
        await addSavedFood(createSavedFoodInput(draftSnapshot));
        resetDraft();
        setPreparedImage(null);
        setImportError(null);
        setImportWarnings([]);
        setSaveSuccess(`Saved ${name} to your food library.`);
        router.refresh();
      } catch (error) {
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
      <section className="space-y-6 lg:space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Add Food
          </h1>
          <p className="text-sm leading-7 text-foreground-muted md:text-base">
            Create a food manually or prep a nutrition label image for AI
            extraction.
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "manual"
                ? "bg-brand-muted text-brand-foreground"
                : "text-foreground-muted"
            }`}
          >
            Manual entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "ai"
                ? "bg-brand-muted text-brand-foreground"
                : "text-foreground-muted"
            }`}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            AI scan
          </button>
        </div>

        {activeTab === "manual" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {importWarnings.length > 0 ? (
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {importWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}

              {saveSuccess ? (
                <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p>{saveSuccess}</p>
                </div>
              ) : null}

              <FoodLibraryForm
                draft={draft}
                disabled={isPersisting || isAnalyzingLabel}
                onChange={updateDraft}
              />

              {saveError ? (
                <div className="flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p>{saveError}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isPersisting || isAnalyzingLabel || !draft.name.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzingLabel
                    ? "Reading label..."
                    : isPersisting
                      ? "Saving..."
                      : "Save to library"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetDraft();
                    setPreparedImage(null);
                    setImportError(null);
                    setImportWarnings([]);
                    setSaveError(null);
                    setSaveSuccess(null);
                  }}
                  disabled={isPersisting || isAnalyzingLabel}
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear form
                </button>
              </div>
            </form>

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
                  Protein {formatNutritionNumber(nutritionSnapshot.macroPercentages.protein)}
                  %, Carbs{" "}
                  {formatNutritionNumber(nutritionSnapshot.macroPercentages.carbs)}
                  %, Fat {formatNutritionNumber(nutritionSnapshot.macroPercentages.fat)}%
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
          </div>
        ) : (
          <div className="space-y-6">
            <NutritionLabelImporter
              disabled={isPersisting || isAnalyzingLabel}
              onPrepared={handlePreparedLabelImage}
            />

            {preparedImage ? (
              <section className="rounded-[1.5rem] border border-border bg-surface p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                  Prepared preview
                </p>
                <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preparedImage.previewUrl}
                    alt="Prepared nutrition label preview"
                    width={preparedImage.width}
                    height={preparedImage.height}
                    className="block h-auto w-full max-w-sm rounded-2xl border border-border"
                  />
                  <div className="space-y-3 text-sm text-foreground-muted">
                    <p className="font-semibold text-foreground">
                      {isAnalyzingLabel
                        ? "Reading the label..."
                        : "Prepared for AI extraction"}
                    </p>
                    <p>
                      {preparedImage.width} x {preparedImage.height}px
                    </p>
                    <p>
                      {(preparedImage.sizeBytes / 1024).toFixed(1)} KB •{" "}
                      {preparedImage.mimeType}
                    </p>
                    <p>
                      Crop: {preparedImage.crop.width}% wide x{" "}
                      {preparedImage.crop.height}% high
                    </p>
                    <p>
                      {isAnalyzingLabel
                        ? "We are extracting the label details and building a draft for you now."
                        : "Once extracted, we will move you back to Manual entry with the form pre-filled."}
                    </p>
                  </div>
                </div>

                {importError ? (
                  <div className="mt-5 flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <p>{importError}</p>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
