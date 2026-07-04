import { getCachedPantryItems } from "@/app/lib/get-cached-pantry-items";
import { getCurrentSession } from "@/app/lib/get-current-session";
import MyPantryManager from "@/app/ui/my-pantry-manager";

type PantryListItem = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  servingsPerContainer: number | null;
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

function mapPantryItem(item: {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  servingsPerContainer: number | null;
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
}): PantryListItem {
  return {
    ...item,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export default async function PantrySection() {
  const session = await getCurrentSession();
  const viewerLabel = session?.user?.name ?? session?.user?.email ?? "there";
  const initialItems = session?.user?.email
    ? (await getCachedPantryItems(session.user.email)).map(mapPantryItem)
    : [];

  return (
    <MyPantryManager
      canPersist={Boolean(session?.user)}
      initialItems={initialItems}
      viewerLabel={viewerLabel}
    />
  );
}
