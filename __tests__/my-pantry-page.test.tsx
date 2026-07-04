import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MyPantryPage from "@/app/my-pantry/page";
import PantrySection from "@/app/my-pantry/pantry-section";

const mockGetCurrentSession = vi.fn();
const mockGetCachedPantryItems = vi.fn();
const mockAddPantryItem = vi.fn();
const mockDeletePantryItem = vi.fn();
const mockRefresh = vi.fn();

vi.mock("@/app/lib/get-current-session", () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
}));

vi.mock("@/app/lib/get-cached-pantry-items", () => ({
  getCachedPantryItems: (...args: unknown[]) =>
    mockGetCachedPantryItems(...args),
}));

vi.mock("@/app/my-pantry/actions", () => ({
  addPantryItem: (...args: unknown[]) => mockAddPantryItem(...args),
  deletePantryItem: (...args: unknown[]) => mockDeletePantryItem(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: (...args: unknown[]) => mockRefresh(...args),
  }),
}));

describe("MyPantryPage", () => {
  beforeEach(() => {
    mockGetCurrentSession.mockReset();
    mockGetCachedPantryItems.mockReset();
    mockAddPantryItem.mockReset();
    mockDeletePantryItem.mockReset();
    mockRefresh.mockReset();
    mockGetCachedPantryItems.mockResolvedValue([]);
    mockAddPantryItem.mockResolvedValue({
      id: "saved-item",
    });
  });

  it("shows the pantry page heading and loading fallback", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await MyPantryPage());

    expect(screen.getByText("My Pantry")).toBeVisible();
    expect(
      screen.getByText(
        "Save foods you use often so your diary flow can pull from a personal, nutrition-aware pantry instead of starting from scratch every time.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Loading pantry")).toBeVisible();
  });

  it("prompts signed-out visitors to sign in before saving foods", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await PantrySection());

    expect(
      screen.getByText("Create an account to save pantry foods."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Sign in to add foods" }),
    ).toBeDisabled();
  });

  it("renders saved pantry items for the signed-in user", async () => {
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

    render(await PantrySection());

    expect(screen.getByText("Build a reusable food library.")).toBeVisible();
    expect(screen.getByText("Greek yogurt")).toBeVisible();
    expect(screen.getByText("Fage")).toBeVisible();
    expect(mockGetCachedPantryItems).toHaveBeenCalledWith("ava@example.com");
  });

  it("lets signed-in users add foods to their pantry", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });

    render(await PantrySection());

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Oats" },
    });
    fireEvent.change(screen.getByLabelText("Brand"), {
      target: { value: "Quaker" },
    });
    fireEvent.change(screen.getByLabelText("Serving size"), {
      target: { value: "40g" },
    });
    fireEvent.change(screen.getByLabelText("Servings per container"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Calories"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByLabelText("Total fat (g)"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Saturated fat (g)"), {
      target: { value: "0.5" },
    });
    fireEvent.change(screen.getByLabelText("Total carbohydrate (g)"), {
      target: { value: "27" },
    });
    fireEvent.change(screen.getByLabelText("Total sugars (g)"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Protein (g)"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Calcium (mg)"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByLabelText("Potassium (mg)"), {
      target: { value: "150" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to pantry" }));

    await waitFor(() => {
      expect(mockAddPantryItem).toHaveBeenCalledWith({
        name: "Oats",
        brand: "Quaker",
        servingSize: "40g",
        servingsPerContainer: 1,
        calories: 150,
        totalFat: 3,
        saturatedFat: 0.5,
        transFat: 0,
        polyunsaturatedFat: 0,
        monounsaturatedFat: 0,
        cholesterolMg: 0,
        sodiumMg: 0,
        totalCarbohydrate: 27,
        dietaryFiber: 0,
        totalSugars: 1,
        addedSugars: 0,
        protein: 5,
        vitaminDMcg: 0,
        calciumMg: 20,
        ironMg: 0,
        potassiumMg: 150,
      });
    });
    expect(screen.getByText("Oats")).toBeVisible();
  });
});
