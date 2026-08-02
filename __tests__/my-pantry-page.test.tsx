import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FoodLibraryPage from "@/app/legacy/food-library/page";
import FoodLibrarySection from "@/app/food-library/food-library-section";

const mockGetCurrentSession = vi.fn();
const mockGetCachedFoodLibraryItems = vi.fn();
const mockAddFoodLibraryItem = vi.fn();
const mockUpdateFoodLibraryItem = vi.fn();
const mockDeleteFoodLibraryItem = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/app/lib/get-current-session", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
}));

vi.mock("@/app/lib/get-cached-saved-foods", () => ({
  getCachedSavedFoods: (...args: unknown[]) =>
    mockGetCachedFoodLibraryItems(...args),
}));

vi.mock("@/app/food-library/actions", () => ({
  addSavedFood: (...args: unknown[]) => mockAddFoodLibraryItem(...args),
  updateSavedFood: (...args: unknown[]) => mockUpdateFoodLibraryItem(...args),
  deleteSavedFood: (...args: unknown[]) => mockDeleteFoodLibraryItem(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: (...args: unknown[]) => mockRefresh(...args),
  }),
}));

describe("FoodLibraryPage", () => {
  beforeEach(() => {
    mockGetCurrentSession.mockReset();
    mockGetCachedFoodLibraryItems.mockReset();
    mockAddFoodLibraryItem.mockReset();
    mockUpdateFoodLibraryItem.mockReset();
    mockDeleteFoodLibraryItem.mockReset();
    mockRefresh.mockReset();
    mockGetCachedFoodLibraryItems.mockResolvedValue([]);
    mockAddFoodLibraryItem.mockResolvedValue({ id: "saved-item" });
    mockUpdateFoodLibraryItem.mockResolvedValue({ id: "updated-item" });
  });

  it("shows the food library page heading and loading fallback", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await FoodLibraryPage());

    expect(screen.getByText("Food Library")).toBeVisible();
    expect(
      screen.getByText(
        "Build a saved foods library that you can search, maintain, and reuse while logging your diary.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Loading saved foods")).toBeVisible();
  });

  it("prompts signed-out visitors to sign in before opening the form", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await FoodLibrarySection());

    expect(screen.getByText("Create an account to save foods.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Manual entry" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Import label" })).toBeDisabled();
    expect(
      screen.getByText(
        "Sign in to open the saved foods form and start building your own food library.",
      ),
    ).toBeVisible();
  });

  it("renders the food catalogue for the signed-in user", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedFoodLibraryItems.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        servingsPerContainer: 1,
        calories: 140,
        totalFat: 4,
        saturatedFat: 2.5,
        transFat: 0,
        polyunsaturatedFat: 0,
        monounsaturatedFat: 0,
        cholesterolMg: 15,
        sodiumMg: 65,
        totalCarbohydrate: 6,
        dietaryFiber: 0,
        totalSugars: 5,
        addedSugars: 0,
        protein: 15,
        vitaminDMcg: 0,
        calciumMg: 190,
        ironMg: 0,
        potassiumMg: 240,
        updatedAt: new Date("2026-07-03T10:00:00.000Z"),
      },
    ]);

    render(await FoodLibrarySection());

    expect(screen.getByText("Search your saved foods.")).toBeVisible();
    expect(screen.getByText("Greek yogurt")).toBeVisible();
    expect(screen.getByText("Fage")).toBeVisible();
    expect(mockGetCachedFoodLibraryItems).toHaveBeenCalledWith(
      "ava@example.com",
    );
  });

  it("opens the form when adding a new food", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });

    render(await FoodLibrarySection());

    fireEvent.click(screen.getByRole("button", { name: "Manual entry" }));

    expect(screen.getByText("Add to your catalogue")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save food" })).toBeVisible();
  });

  it("lets signed-in users edit an existing saved food", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockGetCachedFoodLibraryItems.mockResolvedValue([
      {
        id: "pantry-1",
        name: "Greek yogurt",
        brand: "Fage",
        servingSize: "170g tub",
        servingsPerContainer: 1,
        calories: 140,
        totalFat: 4,
        saturatedFat: 2.5,
        transFat: 0,
        polyunsaturatedFat: 0,
        monounsaturatedFat: 0,
        cholesterolMg: 15,
        sodiumMg: 65,
        totalCarbohydrate: 6,
        dietaryFiber: 0,
        totalSugars: 5,
        addedSugars: 0,
        protein: 15,
        vitaminDMcg: 0,
        calciumMg: 190,
        ironMg: 0,
        potassiumMg: 240,
        updatedAt: new Date("2026-07-03T10:00:00.000Z"),
      },
    ]);

    render(await FoodLibrarySection());

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Greek yogurt Fage",
      }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Greek yogurt 0%" },
    });
    fireEvent.change(screen.getByLabelText("Calories"), {
      target: { value: "130" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateFoodLibraryItem).toHaveBeenCalledWith("pantry-1", {
        name: "Greek yogurt 0%",
        brand: "Fage",
        servingSize: "170g tub",
        servingsPerContainer: 1,
        calories: 130,
        totalFat: 4,
        saturatedFat: 2.5,
        transFat: 0,
        polyunsaturatedFat: 0,
        monounsaturatedFat: 0,
        cholesterolMg: 15,
        sodiumMg: 65,
        totalCarbohydrate: 6,
        dietaryFiber: 0,
        totalSugars: 5,
        addedSugars: 0,
        protein: 15,
        vitaminDMcg: 0,
        calciumMg: 190,
        ironMg: 0,
        potassiumMg: 240,
      });
    });
  });
});
