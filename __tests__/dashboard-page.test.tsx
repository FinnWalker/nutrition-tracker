import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DiaryPage from "@/app/diary/page";
import DiarySection from "@/app/diary/diary-section";

const mockGetCurrentSession = vi.fn();
const mockGetCachedDailyEntries = vi.fn();
const mockGetCachedSavedFoodSummaries = vi.fn();
const mockAddDailyEntry = vi.fn();
const mockDeleteDailyEntry = vi.fn();
const mockClearDailyEntries = vi.fn();
const mockRefresh = vi.fn();
const mockFetch = vi.fn();

vi.mock("@/app/lib/get-current-session", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
}));

vi.mock("@/app/lib/get-cached-daily-entries", () => ({
  getCachedDailyEntries: (...args: unknown[]) =>
    mockGetCachedDailyEntries(...args),
}));

vi.mock("@/app/lib/get-cached-saved-food-summaries", () => ({
  getCachedSavedFoodSummaries: (...args: unknown[]) =>
    mockGetCachedSavedFoodSummaries(...args),
}));

vi.mock("@/app/diary/actions", () => ({
  addDailyEntry: (...args: unknown[]) => mockAddDailyEntry(...args),
  deleteDailyEntry: (...args: unknown[]) => mockDeleteDailyEntry(...args),
  clearDailyEntries: (...args: unknown[]) => mockClearDailyEntries(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: (...args: unknown[]) => mockRefresh(...args),
  }),
}));

describe("DiaryPage", () => {
  beforeEach(() => {
    mockGetCurrentSession.mockReset();
    mockGetCachedDailyEntries.mockReset();
    mockGetCachedSavedFoodSummaries.mockReset();
    mockAddDailyEntry.mockReset();
    mockDeleteDailyEntry.mockReset();
    mockClearDailyEntries.mockReset();
    mockRefresh.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    window.localStorage.clear();
    mockGetCachedDailyEntries.mockResolvedValue([]);
    mockGetCachedSavedFoodSummaries.mockResolvedValue([]);
    mockAddDailyEntry.mockResolvedValue({ id: "saved-entry" });
  });

  it("lets signed-out visitors explore the diary", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await DiaryPage());

    expect(screen.getByText("Diary")).toBeVisible();
    expect(
      screen.getByText(
        "Review your daily totals, pull foods straight from your saved foods, and log meals as your diary fills out through the day.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Summary")).toBeVisible();
    expect(screen.getByText("Today's totals")).toBeVisible();
    expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
  });

  it("lets signed-out visitors explore the resolved diary", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await DiarySection());

    expect(screen.getByText("Quick add")).toBeVisible();
    expect(screen.getByText("Diary snapshot")).toBeVisible();
  });

  it("personalizes the diary when the user is signed in", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedSavedFoodSummaries.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        lastUsedAt: "2026-07-03T10:00:00.000Z",
      },
    ]);

    render(await DiarySection());

    expect(screen.getByText("Summary")).toBeVisible();
    expect(screen.getByText("Today's totals")).toBeVisible();
    expect(screen.getByText("Search your saved foods")).toBeVisible();
    expect(screen.queryByText("140 cal")).not.toBeInTheDocument();
  });

  it("supports fuzzy saved food search in the diary picker", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedSavedFoodSummaries.mockResolvedValue([
      {
        id: "food-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        lastUsedAt: null,
      },
      {
        id: "food-2",
        name: "Banana",
        brand: null,
        servingSize: "1 medium",
        lastUsedAt: null,
      },
    ]);

    render(await DiarySection());

    fireEvent.change(screen.getByLabelText("Search saved foods"), {
      target: { value: "grk ygt" },
    });

    expect(screen.getByText("Greek yogurt")).toBeVisible();
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
  });

  it("lets visitors build up local diary entries before signing in", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await DiarySection());

    fireEvent.change(screen.getByLabelText("Food"), {
      target: { value: "Greek yogurt" },
    });
    fireEvent.change(screen.getByLabelText("Calories"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByLabelText("Protein (g)"), {
      target: { value: "15" },
    });
    fireEvent.change(screen.getByLabelText("Carbs (g)"), {
      target: { value: "9" },
    });
    fireEvent.change(screen.getByLabelText("Fat (g)"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to diary" }));

    expect(screen.getByText("Greek yogurt")).toBeVisible();
    expect(screen.getAllByText("1")[0]).toBeVisible();
    expect(screen.getAllByText("150")[0]).toBeVisible();
    expect(screen.getAllByText("15g")[0]).toBeVisible();
  });

  it("adds a saved food to the diary using scaled portions", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedSavedFoodSummaries.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        lastUsedAt: "2026-07-03T10:00:00.000Z",
      },
    ]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "pantry-1",
        calories: 140,
        totalFat: 4,
        totalCarbohydrate: 6,
        protein: 15,
      }),
    });

    render(await DiarySection());

    fireEvent.click(screen.getByRole("button", { name: /Greek yogurt/i }));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/food-library/pantry-1/diary-details",
        expect.objectContaining({
          method: "GET",
        }),
      );
    });
    fireEvent.change(screen.getByLabelText("Portions"), {
      target: { value: "1.5" },
    });

    expect(screen.getByLabelText("Portions")).toHaveValue(1.5);
    await waitFor(() => {
      expect(screen.getAllByText("210")[0]).toBeVisible();
      expect(screen.getAllByText("9g")[0]).toBeVisible();
      expect(screen.getAllByText("6g")[0]).toBeVisible();
      expect(screen.getAllByText("22.5g")[0]).toBeVisible();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add to diary" }));

    await waitFor(() => {
      expect(mockAddDailyEntry).toHaveBeenCalledWith({
        entryDate: expect.any(String),
        foodName: "Greek yogurt (Fage)",
        savedFoodId: "pantry-1",
        servings: 1.5,
        calories: 210,
        protein: 22.5,
        carbs: 9,
        fat: 6,
      });
    });
    expect(
      screen.getByText(
        "Choose a saved food from the results to scale servings and add it to your diary.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Greek yogurt (Fage)")).toBeVisible();
    expect(screen.getByText("1.5")).toBeVisible();
  });

  it("ignores browser drafts for signed-in users and shows database entries only", async () => {
    window.localStorage.setItem(
      "nutrition-tracker-diary-draft",
      JSON.stringify([
        {
          id: "local-entry",
          entryDate: "2026-07-02",
          foodName: "Local granola",
          calories: 400,
          protein: 11,
          carbs: 42,
          fat: 15,
        },
      ]),
    );

    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedSavedFoodSummaries.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        lastUsedAt: null,
      },
    ]);
    mockGetCachedDailyEntries.mockResolvedValue([
      {
        id: "db-entry",
        entryDate: new Date("2026-07-02T00:00:00.000Z"),
        foodName: "Saved omelette",
        servings: 1,
        calories: 320,
        protein: 24,
        carbs: 4,
        fat: 22,
      },
    ]);

    render(await DiarySection());

    expect(screen.getByText("Saved omelette")).toBeVisible();
    expect(screen.getAllByText("1")[0]).toBeVisible();
    expect(screen.queryByText("Local granola")).not.toBeInTheDocument();
    expect(mockGetCachedDailyEntries).toHaveBeenCalledWith("ava@example.com");
    expect(mockGetCachedSavedFoodSummaries).toHaveBeenCalledWith(
      "ava@example.com",
    );
  });
});
