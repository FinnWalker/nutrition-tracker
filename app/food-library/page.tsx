import { ChevronDown, Search } from "lucide-react";

const foodFilters = [
  { label: "All", count: 128 },
  { label: "Meals", count: 24 },
  { label: "Snacks", count: 32 },
  { label: "Ingredients", count: 42 },
  { label: "Drinks", count: 15 },
  { label: "Supplements", count: 15 },
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
