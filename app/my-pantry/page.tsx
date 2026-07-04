import { Suspense } from "react";
import PantrySection from "./pantry-section";
import MyPantryManager from "@/app/ui/my-pantry-manager";

export const unstable_instant = false;

export default function MyPantryPage() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <h1 className="text-4xl font-semibold tracking-tight">My Pantry</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-foreground-muted">
        Build a personal food catalogue that you can search, maintain, and
        eventually reuse while logging your diary.
      </p>
      <Suspense
        fallback={
          <MyPantryManager
            canPersist={false}
            initialItems={[]}
            viewerLabel="there"
            isLoading
          />
        }
      >
        <PantrySection />
      </Suspense>
    </section>
  );
}
