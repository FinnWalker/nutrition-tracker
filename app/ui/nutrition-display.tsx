export function formatNutritionNumber(value: number) {
  return value % 1 === 0 ? `${value}` : value.toFixed(1);
}

export function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function MacroBreakdown({
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
      <div className="font-medium text-foreground">
        {formatNutritionNumber(total)}g
      </div>
      {sugars > 0 ? (
        <div className="text-xs text-foreground-muted">
          sugars
          <span className="ml-2">{formatNutritionNumber(sugars)}g</span>
        </div>
      ) : null}
      {addedSugars > 0 ? (
        <div className="text-xs text-foreground-muted">
          added sugars
          <span className="ml-2">{formatNutritionNumber(addedSugars)}g</span>
        </div>
      ) : null}
    </div>
  );
}

export function FatBreakdown({
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
      <div className="font-medium text-foreground">
        {formatNutritionNumber(total)}g
      </div>
      {saturatedFat > 0 ? (
        <div className="text-xs text-foreground-muted">
          sat fat
          <span className="ml-2">{formatNutritionNumber(saturatedFat)}g</span>
        </div>
      ) : null}
      {transFat > 0 ? (
        <div className="text-xs text-foreground-muted">
          trans fat
          <span className="ml-2">{formatNutritionNumber(transFat)}g</span>
        </div>
      ) : null}
    </div>
  );
}
