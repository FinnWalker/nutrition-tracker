export type PantryImportDraft = {
  name: string;
  brand: string;
  servingSize: string;
  servingsPerContainer: string;
  calories: string;
  totalFat: string;
  saturatedFat: string;
  transFat: string;
  polyunsaturatedFat: string;
  monounsaturatedFat: string;
  cholesterolMg: string;
  sodiumMg: string;
  totalCarbohydrate: string;
  dietaryFiber: string;
  totalSugars: string;
  addedSugars: string;
  protein: string;
  vitaminDMcg: string;
  calciumMg: string;
  ironMg: string;
  potassiumMg: string;
};

export type PantryImportResponse = {
  draft: PantryImportDraft;
  warnings: string[];
};
