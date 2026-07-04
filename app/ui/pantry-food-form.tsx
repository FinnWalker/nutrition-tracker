import type { ReactNode } from "react";

export type PantryFoodDraft = {
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

type PantryFoodFormProps = {
  draft: PantryFoodDraft;
  disabled: boolean;
  onChange: (field: keyof PantryFoodDraft, value: string) => void;
};

function NutritionNumberRow({
  label,
  name,
  value,
  placeholder,
  disabled,
  onChange,
  inputClassName,
}: {
  label: string;
  name: keyof PantryFoodDraft;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (field: keyof PantryFoodDraft, value: string) => void;
  inputClassName?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        step="any"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-24 rounded-xl border border-border bg-surface px-3 py-2 text-right text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName ?? ""}`}
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
  inputClassName,
  required = false,
}: {
  label: string;
  name: keyof PantryFoodDraft;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (field: keyof PantryFoodDraft, value: string) => void;
  inputClassName?: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className={`w-32 rounded-xl border border-border bg-surface px-3 py-2 text-right text-sm outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName ?? ""}`}
      />
    </label>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground-muted">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function PantryFoodForm({
  draft,
  disabled,
  onChange,
}: PantryFoodFormProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="space-y-4">
        <FormSection title="Product">
          <NutritionTextRow
            label="Name"
            name="name"
            value={draft.name}
            placeholder="Greek yogurt"
            disabled={disabled}
            onChange={onChange}
            inputClassName="w-52"
            required
          />
          <NutritionTextRow
            label="Brand"
            name="brand"
            value={draft.brand}
            placeholder="Fage"
            disabled={disabled}
            onChange={onChange}
            inputClassName="w-40"
          />
          <NutritionNumberRow
            label="Servings per container"
            name="servingsPerContainer"
            value={draft.servingsPerContainer}
            placeholder="1"
            disabled={disabled}
            onChange={onChange}
          />
        </FormSection>

        <FormSection title="Carbs">
          <NutritionNumberRow
            label="Total carbohydrate (g)"
            name="totalCarbohydrate"
            value={draft.totalCarbohydrate}
            placeholder="6"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Dietary fiber (g)"
            name="dietaryFiber"
            value={draft.dietaryFiber}
            placeholder="0"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Total sugars (g)"
            name="totalSugars"
            value={draft.totalSugars}
            placeholder="5"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Added sugars (g)"
            name="addedSugars"
            value={draft.addedSugars}
            placeholder="0"
            disabled={disabled}
            onChange={onChange}
          />
        </FormSection>

        <FormSection title="Fat">
          <NutritionNumberRow
            label="Total fat (g)"
            name="totalFat"
            value={draft.totalFat}
            placeholder="4"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Saturated fat (g)"
            name="saturatedFat"
            value={draft.saturatedFat}
            placeholder="2.5"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Trans fat (g)"
            name="transFat"
            value={draft.transFat}
            placeholder="0"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Polyunsaturated fat (g)"
            name="polyunsaturatedFat"
            value={draft.polyunsaturatedFat}
            placeholder="0"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Monounsaturated fat (g)"
            name="monounsaturatedFat"
            value={draft.monounsaturatedFat}
            placeholder="0"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Cholesterol (mg)"
            name="cholesterolMg"
            value={draft.cholesterolMg}
            placeholder="15"
            disabled={disabled}
            onChange={onChange}
          />
        </FormSection>

        <FormSection title="Protein">
          <NutritionNumberRow
            label="Protein (g)"
            name="protein"
            value={draft.protein}
            placeholder="15"
            disabled={disabled}
            onChange={onChange}
          />
        </FormSection>
      </div>

      <div className="space-y-4">
        <FormSection title="Serving">
          <NutritionTextRow
            label="Serving size"
            name="servingSize"
            value={draft.servingSize}
            placeholder="170g tub"
            disabled={disabled}
            onChange={onChange}
            inputClassName="w-44"
          />
          <NutritionNumberRow
            label="Calories"
            name="calories"
            value={draft.calories}
            placeholder="140"
            disabled={disabled}
            onChange={onChange}
          />
        </FormSection>

        <FormSection title="Micros">
          <NutritionNumberRow
            label="Sodium (mg)"
            name="sodiumMg"
            value={draft.sodiumMg}
            placeholder="65"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Vitamin D (mcg)"
            name="vitaminDMcg"
            value={draft.vitaminDMcg}
            placeholder="0"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Calcium (mg)"
            name="calciumMg"
            value={draft.calciumMg}
            placeholder="190"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Iron (mg)"
            name="ironMg"
            value={draft.ironMg}
            placeholder="0"
            disabled={disabled}
            onChange={onChange}
          />
          <NutritionNumberRow
            label="Potassium (mg)"
            name="potassiumMg"
            value={draft.potassiumMg}
            placeholder="240"
            disabled={disabled}
            onChange={onChange}
          />
        </FormSection>
      </div>
    </div>
  );
}
