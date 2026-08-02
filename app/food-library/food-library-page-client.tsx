"use client";

import Fuse from "fuse.js";
import { useDeferredValue, useId, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

type FoodLibraryItem = {
  id: string;
  name: string;
  brand: string | null;
  serving: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type FoodFilter = {
  label: string;
  count: number;
};

type FoodLibraryPageClientProps = {
  canBrowse: boolean;
  items: FoodLibraryItem[];
};

const placeholderFilters = [
  "Meals",
  "Snacks",
  "Ingredients",
  "Drinks",
  "Supplements",
] as const;

export default function FoodLibraryPageClient({
  canBrowse,
  items,
}: FoodLibraryPageClientProps) {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const mobileFilterId = useId();
  const deferredQuery = useDeferredValue(query);
  const searchTerm = deferredQuery.trim();

  const filters: FoodFilter[] = [
    { label: "All", count: items.length },
    ...placeholderFilters.map((label) => ({ label, count: 0 })),
  ];

  const visibleItems =
    selectedFilter === "All"
      ? searchTerm
        ? searchTerm.length === 1
          ? getSingleCharacterMatches(items, searchTerm)
          : new Fuse(items, {
              threshold: 0.6,
              ignoreLocation: true,
              keys: [
                { name: "name", weight: 0.7 },
                { name: "brand", weight: 0.2 },
                { name: "serving", weight: 0.1 },
              ],
            })
              .search(searchTerm)
              .map((result) => result.item)
        : items
      : [];

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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search foods..."
              className="h-11 w-full rounded-xl border border-border bg-white px-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand"
            />
          </label>

          <div className="max-w-[12rem]">
            <FilterSelect
              id={mobileFilterId}
              value={selectedFilter}
              onChange={setSelectedFilter}
              options={filters}
            />
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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search foods..."
              className="h-11 w-full rounded-xl border border-border bg-white px-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand"
            />
          </label>

          <div className="flex flex-wrap gap-2.5 xl:w-auto">
            {filters.map((filter) => {
              const isActive = selectedFilter === filter.label;

              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => setSelectedFilter(filter.label)}
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
                {visibleItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="border-b border-border px-5 py-4 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <FoodPlaceholder name={item.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-sm text-foreground-muted">
                            {formatSubtitle(item)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.calories)} kcal
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.protein)}g
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.carbs)}g
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm font-medium text-foreground last:border-b-0">
                      {formatNumber(item.fat)}g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {visibleItems.map((item) => (
              <article key={item.id} className="flex items-center gap-3 px-4 py-3">
                <FoodPlaceholder name={item.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {formatSubtitle(item)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatNumber(item.calories)} kcal
                  </p>
                </div>
              </article>
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <EmptyState canBrowse={canBrowse} hasQuery={searchTerm.length > 0} />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FilterSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FoodFilter[];
}) {
  return (
    <label htmlFor={id} className="relative block min-w-0 xl:min-w-44">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand"
      >
        {options.map((option) => (
          <option key={option.label} value={option.label}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-foreground-muted"
        aria-hidden="true"
      />
    </label>
  );
}

function FoodPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-[4.35rem] w-[4.35rem] shrink-0 items-center justify-center rounded-[1rem] bg-brand-muted text-base font-semibold text-brand-foreground">
      <span aria-hidden="true">{initials || "F"}</span>
    </div>
  );
}

function EmptyState({
  canBrowse,
  hasQuery,
}: {
  canBrowse: boolean;
  hasQuery: boolean;
}) {
  let message = "No foods found.";

  if (!canBrowse) {
    message = "Sign in to view your saved foods.";
  } else if (hasQuery) {
    message = "No foods match that search.";
  } else {
    message = "No foods saved yet. Add one from the navigation to get started.";
  }

  return (
    <div className="px-4 py-10 text-center text-sm font-medium text-foreground-muted lg:px-5">
      {message}
    </div>
  );
}

function formatSubtitle(item: FoodLibraryItem) {
  return item.serving || item.brand || "Serving details unavailable";
}

function formatNumber(value: number) {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return rounded.replace(/\.0$/, "");
}

function getSingleCharacterMatches(items: FoodLibraryItem[], searchTerm: string) {
  const normalizedSearchTerm = searchTerm.toLowerCase();

  return items
    .filter((item) => {
      const searchableText = [item.name, item.brand ?? "", item.serving ?? ""].join(
        " ",
      );

      return searchableText.toLowerCase().includes(normalizedSearchTerm);
    })
    .sort((leftItem, rightItem) => {
      const leftNameStartsWithSearch = leftItem.name
        .toLowerCase()
        .startsWith(normalizedSearchTerm);
      const rightNameStartsWithSearch = rightItem.name
        .toLowerCase()
        .startsWith(normalizedSearchTerm);

      if (leftNameStartsWithSearch !== rightNameStartsWithSearch) {
        return leftNameStartsWithSearch ? -1 : 1;
      }

      return leftItem.name.localeCompare(rightItem.name);
    });
}
