import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MyPantryPage from "@/app/my-pantry/page";
import PantrySection from "@/app/my-pantry/pantry-section";

const mockGetCurrentSession = vi.fn();
const mockGetCachedPantryItems = vi.fn();
const mockAddPantryItem = vi.fn();
const mockUpdatePantryItem = vi.fn();
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
  updatePantryItem: (...args: unknown[]) => mockUpdatePantryItem(...args),
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
    mockUpdatePantryItem.mockReset();
    mockDeletePantryItem.mockReset();
    mockRefresh.mockReset();
    mockGetCachedPantryItems.mockResolvedValue([]);
    mockAddPantryItem.mockResolvedValue({ id: "saved-item" });
    mockUpdatePantryItem.mockResolvedValue({ id: "updated-item" });
  });

  it("shows the pantry page heading and loading fallback", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await MyPantryPage());

    expect(screen.getByText("My Pantry")).toBeVisible();
    expect(
      screen.getByText(
        "Build a personal food catalogue that you can search, maintain, and eventually reuse while logging your diary.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Loading pantry")).toBeVisible();
  });

  it("prompts signed-out visitors to sign in before opening the form", async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    render(await PantrySection());

    expect(
      screen.getByText("Create an account to save pantry foods."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Add food" })).toBeDisabled();
    expect(
      screen.getByText(
        "Sign in to open the pantry form and start building your own food database.",
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

    expect(
      screen.getByText("Search your personal food database."),
    ).toBeVisible();
    expect(screen.getByText("Greek yogurt")).toBeVisible();
    expect(screen.getByText("Fage")).toBeVisible();
    expect(mockGetCachedPantryItems).toHaveBeenCalledWith("ava@example.com");
  });

  it("opens the form when adding a new food", async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });

    render(await PantrySection());

    fireEvent.click(screen.getByRole("button", { name: "Add food" }));

    expect(screen.getByText("Add to your catalogue")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add to pantry" })).toBeVisible();
  });

  it("lets signed-in users edit an existing pantry item", async () => {
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
      expect(mockUpdatePantryItem).toHaveBeenCalledWith("pantry-1", {
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
