"use client";

import type { FormEvent } from "react";
import { startTransition, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getMacroCalorieEstimate,
  getMacroCalorieWarning,
  parseNutritionNumber,
} from "@/app/lib/nutrition-validation";
import { updateUserGoals } from "./actions";

type GoalsPageClientProps = {
  canPersist: boolean;
  initialGoals: {
    dailyCalorieGoal: number | null;
    dailyProteinGoal: number | null;
    dailyCarbsGoal: number | null;
    dailyFatGoal: number | null;
  };
  isLoading?: boolean;
};

type GoalsDraft = {
  dailyCalorieGoal: string;
  dailyProteinGoal: string;
  dailyCarbsGoal: string;
  dailyFatGoal: string;
};

export default function GoalsPageClient({
  canPersist,
  initialGoals,
  isLoading = false,
}: GoalsPageClientProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<GoalsDraft>({
    dailyCalorieGoal:
      initialGoals.dailyCalorieGoal === null
        ? ""
        : `${initialGoals.dailyCalorieGoal}`,
    dailyProteinGoal:
      initialGoals.dailyProteinGoal === null
        ? ""
        : `${initialGoals.dailyProteinGoal}`,
    dailyCarbsGoal:
      initialGoals.dailyCarbsGoal === null
        ? ""
        : `${initialGoals.dailyCarbsGoal}`,
    dailyFatGoal:
      initialGoals.dailyFatGoal === null ? "" : `${initialGoals.dailyFatGoal}`,
  });
  const [isPersisting, setIsPersisting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const validation = useMemo(() => {
    const calories = parseNutritionNumber(draft.dailyCalorieGoal);
    const protein = parseNutritionNumber(draft.dailyProteinGoal);
    const carbs = parseNutritionNumber(draft.dailyCarbsGoal);
    const fat = parseNutritionNumber(draft.dailyFatGoal);
    const warnings: string[] = [];
    const hasCalorieGoal = draft.dailyCalorieGoal.trim().length > 0;
    const providedMacroGoals = [
      draft.dailyProteinGoal,
      draft.dailyCarbsGoal,
      draft.dailyFatGoal,
    ].filter((value) => value.trim().length > 0).length;
    const allMacroGoalsProvided = providedMacroGoals === 3;
    const macroCalorieWarning = getMacroCalorieWarning({
      calories,
      protein,
      carbs,
      fat,
    });
    const { estimatedCalories, calorieGap } = getMacroCalorieEstimate({
      calories,
      protein,
      carbs,
      fat,
    });

    if (hasCalorieGoal && allMacroGoalsProvided && macroCalorieWarning) {
      warnings.push(macroCalorieWarning);
    }

    if (
      hasCalorieGoal &&
      !allMacroGoalsProvided &&
      estimatedCalories > calories + 20
    ) {
      warnings.push(
        `The entered macro goals already add up to ${estimatedCalories} kcal, which is ${Math.abs(calorieGap)} kcal above the entered calories.`,
      );
    }

    const checks =
      warnings.length === 0
        ? [
            allMacroGoalsProvided && hasCalorieGoal
              ? "Calories and macros look internally consistent."
              : "Targets look sensible so far.",
          ]
        : [];

    return {
      estimatedCalories,
      warnings,
      checks,
      percentages:
        calories > 0
          ? {
              protein: Math.round((protein * 4 * 100) / calories),
              carbs: Math.round((carbs * 4 * 100) / calories),
              fat: Math.round((fat * 9 * 100) / calories),
            }
          : null,
    };
  }, [draft]);

  function updateDraft(field: keyof GoalsDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canPersist || isLoading || isPersisting) {
      return;
    }

    setIsPersisting(true);
    setSaveError(null);
    setSaveSuccess(null);

    startTransition(async () => {
      try {
        await updateUserGoals({
          dailyCalorieGoal: parseNutritionNumber(draft.dailyCalorieGoal),
          dailyProteinGoal: parseNutritionNumber(draft.dailyProteinGoal),
          dailyCarbsGoal: parseNutritionNumber(draft.dailyCarbsGoal),
          dailyFatGoal: parseNutritionNumber(draft.dailyFatGoal),
        });
        setSaveSuccess("Goals saved.");
        router.refresh();
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "We couldn't save your goals. Please try again.",
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
          Goals
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
          <section className="rounded-[1.6rem] border border-border bg-white p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                Daily targets
              </p>
              <p className="text-sm text-foreground-muted">
                Keep this simple: enter the calories and macros you want to hit
                each day.
              </p>
            </div>

            <div className="mt-5 space-y-3 border-b border-border pb-4">
              <label
                htmlFor="dailyCalorieGoal"
                className="flex flex-wrap items-center gap-3 text-sm font-medium text-foreground"
              >
                <input
                  id="dailyCalorieGoal"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.dailyCalorieGoal}
                  onChange={(event) =>
                    updateDraft("dailyCalorieGoal", event.target.value)
                  }
                  disabled={!canPersist || isLoading || isPersisting}
                  className="w-28 rounded-xl border border-border bg-white px-3 py-2 text-base font-semibold text-foreground outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span>kcal a day</span>
              </label>
            </div>

            <div className="space-y-3 pt-4">
              <GoalInput
                id="dailyProteinGoal"
                value={draft.dailyProteinGoal}
                onChange={(value) => updateDraft("dailyProteinGoal", value)}
                label="protein"
                disabled={!canPersist || isLoading || isPersisting}
                percentage={validation.percentages?.protein ?? null}
              />
              <GoalInput
                id="dailyCarbsGoal"
                value={draft.dailyCarbsGoal}
                onChange={(value) => updateDraft("dailyCarbsGoal", value)}
                label="carbs"
                disabled={!canPersist || isLoading || isPersisting}
                percentage={validation.percentages?.carbs ?? null}
              />
              <GoalInput
                id="dailyFatGoal"
                value={draft.dailyFatGoal}
                onChange={(value) => updateDraft("dailyFatGoal", value)}
                label="fat"
                disabled={!canPersist || isLoading || isPersisting}
                percentage={validation.percentages?.fat ?? null}
              />
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-border bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
              Validation
            </p>

            <p className="mt-3 text-sm text-foreground-muted">
              Macro calories estimate: {validation.estimatedCalories} kcal
            </p>

            {validation.warnings.length > 0 ? (
              <div className="mt-4 space-y-3">
                {validation.warnings.map((warning) => (
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
                {validation.checks.map((check) => (
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
          </section>

          {saveError ? (
            <p className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {saveError}
            </p>
          ) : null}

          {saveSuccess ? (
            <p className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {saveSuccess}
            </p>
          ) : null}

          <div>
            <button
              type="submit"
              disabled={!canPersist || isLoading || isPersisting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPersisting ? "Saving..." : "Save goals"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function GoalInput({
  id,
  value,
  onChange,
  label,
  disabled,
  percentage,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled: boolean;
  percentage: number | null;
}) {
  return (
    <label
      htmlFor={id}
      className="flex flex-wrap items-center gap-3 text-sm font-medium text-foreground"
    >
      <input
        id={id}
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-28 rounded-xl border border-border bg-white px-3 py-2 text-base font-semibold text-foreground outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="0"
      />
      <span>g of {label} a day</span>
      {percentage !== null && value.trim() ? (
        <span className="text-sm font-semibold text-foreground-muted">
          {percentage}%
        </span>
      ) : null}
    </label>
  );
}
