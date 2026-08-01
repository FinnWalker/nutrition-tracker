import { Suspense } from "react";
import FoodLibrarySection from "@/app/food-library/food-library-section";
import FoodLibraryManager from "@/app/ui/food-library-manager";
import PageContainer from "@/app/ui/page-container";

export const unstable_instant = false;

export default function LegacyFoodLibraryPage() {
  return (
    <PageContainer>
      <h1 className="text-4xl font-semibold tracking-tight">Food Library</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-foreground-muted">
        Build a saved foods library that you can search, maintain, and reuse
        while logging your diary.
      </p>
      <Suspense
        fallback={
          <FoodLibraryManager
            canPersist={false}
            initialItems={[]}
            viewerLabel="there"
            isLoading
          />
        }
      >
        <FoodLibrarySection />
      </Suspense>
    </PageContainer>
  );
}
