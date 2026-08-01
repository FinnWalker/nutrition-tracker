import { ChevronDown, Search } from "lucide-react";

const foodFilters = [
  { label: "All", count: 128 },
  { label: "Meals", count: 24 },
  { label: "Snacks", count: 32 },
  { label: "Ingredients", count: 42 },
  { label: "Drinks", count: 15 },
  { label: "Supplements", count: 15 },
] as const;

const foodLibraryItems = [
  {
    name: "Chicken Breast",
    serving: "150 g",
    calories: 248,
    protein: 46,
    carbs: 0,
    fat: 5,
    emoji: "🍗",
  },
  {
    name: "Brown Rice (Cooked)",
    serving: "1 cup (195g)",
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
    emoji: "🍚",
  },
  {
    name: "Greek Yogurt (Plain)",
    serving: "1 container (150g)",
    calories: 140,
    protein: 15,
    carbs: 6,
    fat: 5,
    emoji: "🥣",
  },
  {
    name: "Oatmeal (Dry)",
    serving: "1 cup (64g)",
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 3,
    emoji: "🥣",
  },
  {
    name: "Whey Protein (Vanilla)",
    serving: "1 scoop (30g)",
    calories: 120,
    protein: 24,
    carbs: 3,
    fat: 2,
    emoji: "🥛",
  },
  {
    name: "Banana (Medium)",
    serving: "1 medium (118g)",
    calories: 105,
    protein: 1,
    carbs: 27,
    fat: 0,
    emoji: "🍌",
  },
  {
    name: "Almonds",
    serving: "1 oz (28g)",
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    emoji: "🌰",
  },
] as const;

export default function FoodLibraryPage() {
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
              placeholder="Search foods..."
              className="h-11 w-full rounded-xl border border-border bg-white px-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand"
            />
          </label>

          <div className="max-w-[10rem]">
            <FilterSelect options={foodFilters.map((filter) => filter.label)} />
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
              placeholder="Search foods..."
              className="h-11 w-full rounded-xl border border-border bg-white px-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand"
            />
          </label>

          <div className="flex flex-wrap gap-2.5 xl:w-auto">
            {foodFilters.map((filter, index) => {
              const isActive = index === 0;

              return (
                <button
                  key={filter.label}
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-brand-muted bg-brand-muted text-brand-foreground"
                      : "border-border bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`text-xs font-semibold ${
                      isActive ? "text-brand-foreground/80" : "text-foreground-muted"
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
                </tr>
              </thead>
              <tbody>
                {foodLibraryItems.map((item) => (
                  <tr key={item.name} className="group">
                    <td className="border-b border-border px-5 py-4 last:border-b-0">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-elevated text-xl shadow-[inset_0_0_0_1px_var(--color-border)]">
                          <span aria-hidden="true">{item.emoji}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-sm text-foreground-muted">
                            {item.serving}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {item.calories} kcal
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {item.protein}g
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {item.carbs}g
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {item.fat}g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {foodLibraryItems.map((item) => (
              <article key={item.name} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated text-xl shadow-[inset_0_0_0_1px_var(--color-border)]">
                  <span aria-hidden="true">{item.emoji}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {item.serving}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {item.calories} kcal
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterSelect({ options }: { options: readonly string[] }) {
  return (
    <label className="relative block min-w-0 xl:min-w-44">
      <select className="h-11 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-foreground-muted"
        aria-hidden="true"
      />
    </label>
  );
}
