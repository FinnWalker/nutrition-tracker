import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";

const mockAuth = vi.fn();
const mockGetCachedDailyEntries = vi.fn();
const mockAddDailyEntry = vi.fn();
const mockDeleteDailyEntry = vi.fn();
const mockClearDailyEntries = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/app/lib/get-cached-daily-entries", () => ({
  getCachedDailyEntries: (...args: unknown[]) =>
    mockGetCachedDailyEntries(...args),
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
    mockAuth.mockReset();
    mockGetCachedDailyEntries.mockReset();
    mockAddDailyEntry.mockReset();
    mockDeleteDailyEntry.mockReset();
    mockClearDailyEntries.mockReset();
    mockRefresh.mockReset();
    window.localStorage.clear();
    mockGetCachedDailyEntries.mockResolvedValue([]);
  });

  it("lets signed-out visitors explore the dashboard", async () => {
    mockAuth.mockResolvedValue(null);

    render(await DashboardPage());

    expect(screen.getByText("Dashboard")).toBeVisible();
    expect(
      screen.getByText("Explore the diary flow before you create an account."),
    ).toBeVisible();
    expect(
      screen.getByText("You can log food before creating an account."),
    ).toBeVisible();
    expect(screen.getByText("Add an entry")).toBeVisible();
    expect(screen.getByText("Today's entries")).toBeVisible();
  });

  it("personalizes the dashboard when the user is signed in", async () => {
    mockAuth.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });

    render(await DashboardPage());

    expect(screen.getByText("Signed in as Ava Green.")).toBeVisible();
    expect(screen.getByText("Welcome back, Ava Green.")).toBeVisible();
    expect(
      screen.getByText(
        "These entries are loading from your saved diary. Browser-only drafts are ignored until we add an explicit import flow.",
      ),
    ).toBeVisible();
  });

  it("lets visitors build up local diary entries before signing in", async () => {
    mockAuth.mockResolvedValue(null);

    render(await DashboardPage());

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
    expect(screen.getAllByText("150")[0]).toBeVisible();
    expect(screen.getAllByText("15g")[0]).toBeVisible();
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

    mockAuth.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedDailyEntries.mockResolvedValue([
      {
        id: "db-entry",
        entryDate: new Date("2026-07-02T00:00:00.000Z"),
        foodName: "Saved omelette",
        calories: 320,
        protein: 24,
        carbs: 4,
        fat: 22,
      },
    ]);

    render(await DashboardPage());

    expect(screen.getByText("Saved omelette")).toBeVisible();
    expect(screen.queryByText("Local granola")).not.toBeInTheDocument();
    expect(mockGetCachedDailyEntries).toHaveBeenCalledWith("ava@example.com");
  });
});
