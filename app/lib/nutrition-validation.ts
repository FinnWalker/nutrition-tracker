export function parseNutritionNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getMacroCalorieEstimate({
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
  const estimatedCalories = protein * 4 + carbs * 4 + fat * 9;
  const calorieGap = Math.round(calories - estimatedCalories);

  return {
    estimatedCalories,
    calorieGap,
  };
}

export function getMacroCalorieWarning({
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

  if (calories > 0 && Math.abs(calorieGap) > 20) {
    return `Macro calories estimate ${estimatedCalories} kcal, which is ${Math.abs(calorieGap)} kcal ${calorieGap > 0 ? "below" : "above"} the entered calories.`;
  }

  return null;
}
