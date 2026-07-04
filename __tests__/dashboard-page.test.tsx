import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import DashboardDiarySection from "@/app/dashboard/dashboard-diary-section";

const mockGetCurrentSession = vi.fn();
const mockGetCachedDailyEntries = vi.fn();
const mockGetCachedPantryItems = vi.fn();
const mockAddDailyEntry = vi.fn();
const mockDeleteDailyEntry = vi.fn();
const mockClearDailyEntries = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/app/lib/get-current-session", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
}));

vi.mock("@/app/lib/get-cached-daily-entries", () => ({
  getCachedDailyEntries: (...args: unknown[]) =>
    mockGetCachedDailyEntries(...args),
}));

vi.mock("@/app/lib/get-cached-pantry-items", () => ({
  getCachedPantryItems: (...args: unknown[]) =>
    mockGetCachedPantryItems(...args),
}));

vi.mock("@/app/dashboard/actions", () => ({
  addDailyEntry: (...args: unknown[]) => mockAddDailyEntry(...args),
  deleteDailyEntry: (...args: unknown[]) => mockDeleteDailyEntry(...args),
  clearDailyEntries: (...args: unknown[]) => mockClearDailyEntries(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: (...args: unknown[]) => mockRefresh(...args),
  }),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    mockGetCurrentSession.mockReset();
    mockGetCachedDailyEntries.mockReset();
    mockGetCachedPantryItems.mockReset();
    mockAddDailyEntry.mockReset();
    mockDeleteDailyEntry.mockReset();
    mockClearDailyEntries.mockReset();
    mockRefresh.mockReset();
    window.localStorage.clear();
    mockGetCachedDailyEntries.mockResolvedValue([]);
    mockGetCachedPantryItems.mockResolvedValue([]);
    mockAddDailyEntry.mockResolvedValue({ id: "saved-entry" });
  });

  it("lets signed-out visitors explore the dashboard", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await DashboardPage());

    expect(screen.getByText("Dashboard")).toBeVisible();
    expect(
      screen.getByText(
        "Review your daily totals, then pull foods straight from your pantry into the diary as you log meals.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Loading diary")).toBeVisible();
    expect(screen.getByText("Preparing your dashboard.")).toBeVisible();
    expect(
      screen.getByText(
        "We are checking whether your diary and pantry are ready.",
        {
          exact: false,
        },
      ),
    ).toBeVisible();
  });

  it("lets signed-out visitors explore the resolved dashboard", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await DashboardDiarySection());

    expect(
      screen.getByText("You can log food before creating an account."),
    ).toBeVisible();
    expect(screen.getByText("Quick add")).toBeVisible();
    expect(screen.getByText("Diary snapshot")).toBeVisible();
  });

  it("personalizes the dashboard when the user is signed in", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedPantryItems.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        calories: 140,
        totalFat: 4,
        totalCarbohydrate: 6,
        protein: 15,
      },
    ]);

    render(await DashboardDiarySection());

    expect(screen.getByText("Your daily summary comes first.")).toBeVisible();
    expect(
      screen.getByText(
        "Welcome back, Ava Green. Pick a saved pantry item, scale the portions, and add it straight into today's diary.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Build today's diary from saved foods"),
    ).toBeVisible();
  });

  it("lets visitors build up local diary entries before signing in", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await DashboardDiarySection());

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

  it("adds a pantry item to the diary using scaled portions", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedPantryItems.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        calories: 140,
        totalFat: 4,
        totalCarbohydrate: 6,
        protein: 15,
      },
    ]);

    render(await DashboardDiarySection());

    fireEvent.change(screen.getByLabelText("Portions"), {
      target: { value: "1.5" },
    });

    expect(screen.getByLabelText("Portions")).toHaveValue(1.5);
    expect(screen.getAllByText("210")[0]).toBeVisible();
    expect(screen.getAllByText("9g")[0]).toBeVisible();
    expect(screen.getAllByText("6g")[0]).toBeVisible();
    expect(screen.getAllByText("22.5g")[0]).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Add to diary" }));

    await waitFor(() => {
      expect(mockAddDailyEntry).toHaveBeenCalledWith({
        entryDate: expect.any(String),
        foodName: "Greek yogurt (Fage)",
        servings: 1.5,
        calories: 210,
        protein: 22.5,
        carbs: 9,
        fat: 6,
      });
    });
    expect(screen.getByText("Greek yogurt (Fage)")).toBeVisible();
    expect(screen.getByText("1.5")).toBeVisible();
  });

  it("ignores browser drafts for signed-in users and shows database entries only", async () => {
    window.localStorage.setItem(
      "nutrition-tracker-dashboard-draft",
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
    mockGetCachedPantryItems.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        calories: 140,
        totalFat: 4,
        totalCarbohydrate: 6,
        protein: 15,
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

    render(await DashboardDiarySection());

    expect(screen.getByText("Saved omelette")).toBeVisible();
    expect(screen.getAllByText("1")[0]).toBeVisible();
    expect(screen.queryByText("Local granola")).not.toBeInTheDocument();
    expect(mockGetCachedDailyEntries).toHaveBeenCalledWith("ava@example.com");
    expect(mockGetCachedPantryItems).toHaveBeenCalledWith("ava@example.com");
  });
});
