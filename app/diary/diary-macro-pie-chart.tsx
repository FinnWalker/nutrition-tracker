"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatNutritionNumber } from "@/app/ui/nutrition-display";

const chartColors = {
  protein: "#22c55e",
  carbs: "#3b82f6",
  fat: "#f59e0b",
  empty: "#ede9fe",
} as const;

type DiaryMacroPieChartProps = {
  calories: number;
  calorieGoal: number | null;
  protein: number;
  carbs: number;
  fat: number;
};

export default function DiaryMacroPieChart({
  calories,
  calorieGoal,
  protein,
  carbs,
  fat,
}: DiaryMacroPieChartProps) {
  const goalCalories =
    calorieGoal && calorieGoal > 0 ? Math.round(calorieGoal) : null;
  const visibleTotal = goalCalories ?? Math.max(1, calories);
  const consumedCalories = Math.min(calories, visibleTotal);
  const macroCalorieTotal = protein * 4 + carbs * 4 + fat * 9;
  const macroSegments = [
    {
      key: "protein",
      value: protein * 4,
      fill: chartColors.protein,
    },
    {
      key: "carbs",
      value: carbs * 4,
      fill: chartColors.carbs,
    },
    {
      key: "fat",
      value: fat * 9,
      fill: chartColors.fat,
    },
  ].filter((item) => item.value > 0);
  const macroCalories =
    macroCalorieTotal > 0
      ? macroSegments
          .map((item) => ({
            ...item,
            value: (item.value / macroCalorieTotal) * consumedCalories,
          }))
          .filter((item) => item.value > 0)
      : [];
  const remainingCalories = Math.max(0, visibleTotal - consumedCalories);

  const data =
    macroCalories.length > 0 || remainingCalories > 0
      ? [
          ...macroCalories,
          ...(remainingCalories > 0
            ? [
                {
                  key: "empty",
                  value: remainingCalories,
                  fill: chartColors.empty,
                },
              ]
            : []),
        ]
      : [{ key: "empty", value: 1, fill: chartColors.empty }];

  return (
    <div className="relative h-40 w-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            cx="50%"
            cy="50%"
            innerRadius={49}
            outerRadius={64}
            paddingAngle={macroCalories.length > 1 ? 3 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-full text-center">
        <span className="text-[2rem] leading-none font-bold tracking-tight text-foreground">
          {formatNutritionNumber(calories)}
        </span>
      </div>
    </div>
  );
}
