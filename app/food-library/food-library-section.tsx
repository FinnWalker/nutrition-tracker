import { getCachedSavedFoods } from "@/app/lib/get-cached-saved-foods";
import { getCurrentSession } from "@/app/lib/get-current-session";
import FoodLibraryManager from "@/app/ui/food-library-manager";

type FoodLibraryListItem = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  servingsPerContainer: number | null;
  lastUsedAt: string | null;
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  polyunsaturatedFat: number;
  monounsaturatedFat: number;
  cholesterolMg: number;
  sodiumMg: number;
  totalCarbohydrate: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars: number;
  protein: number;
  vitaminDMcg: number;
  calciumMg: number;
  ironMg: number;
  potassiumMg: number;
  updatedAt: string;
};

function mapFoodLibraryItem(item: {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  servingsPerContainer: number | null;
  lastUsedAt: Date | null;
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  polyunsaturatedFat: number;
  monounsaturatedFat: number;
  cholesterolMg: number;
  sodiumMg: number;
  totalCarbohydrate: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars: number;
  protein: number;
  vitaminDMcg: number;
  calciumMg: number;
  ironMg: number;
  potassiumMg: number;
  updatedAt: Date;
}): FoodLibraryListItem {
  return {
    ...item,
    lastUsedAt: item.lastUsedAt?.toISOString() ?? null,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export default async function FoodLibrarySection() {
  const session = await getCurrentSession();
  const viewerLabel = session?.user?.name ?? session?.user?.email ?? "there";
  const initialItems = session?.user?.email
    ? (await getCachedSavedFoods(session.user.email)).map(mapFoodLibraryItem)
    : [];

  return (
    <FoodLibraryManager
      canPersist={Boolean(session?.user)}
      initialItems={initialItems}
      viewerLabel={viewerLabel}
    />
  );
}
