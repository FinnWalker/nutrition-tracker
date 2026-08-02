import { describe, expect, it } from "vitest";
import { normalizeModelOutput } from "@/app/lib/extract-pantry-label-from-image";

describe("normalizeModelOutput", () => {
  it("prefers per serving values over per container values when both are present", () => {
    const result = normalizeModelOutput({
      per100Heading: "Per container",
      perServingHeading: "Per serving",
      per100: {
        calories: "300",
        totalFat: "12 g",
        saturatedFat: "",
        transFat: "",
        polyunsaturatedFat: "",
        monounsaturatedFat: "",
        cholesterolMg: "",
        sodiumMg: "600 mg",
        totalCarbohydrate: "30 g",
        dietaryFiber: "",
        totalSugars: "8 g",
        addedSugars: "",
        protein: "10 g",
        calciumMg: "",
        ironMg: "",
        potassiumMg: "",
        saltGrams: "",
      },
      perServing: {
        calories: "150",
        totalFat: "6 g",
        saturatedFat: "",
        transFat: "",
        polyunsaturatedFat: "",
        monounsaturatedFat: "",
        cholesterolMg: "",
        sodiumMg: "300 mg",
        totalCarbohydrate: "15 g",
        dietaryFiber: "",
        totalSugars: "4 g",
        addedSugars: "",
        protein: "5 g",
        calciumMg: "",
        ironMg: "",
        potassiumMg: "",
        saltGrams: "",
      },
    });

    expect(result.draft.servingSize).toBe("");
    expect(result.draft.calories).toBe("150");
    expect(result.draft.totalFat).toBe("6");
    expect(result.draft.sodiumMg).toBe("300");
    expect(result.warnings).toContain(
      "Values were imported from the Per serving column.",
    );
  });
});
