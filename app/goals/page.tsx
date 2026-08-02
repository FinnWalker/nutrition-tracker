import { Suspense } from "react";
import { getCachedUserGoals } from "@/app/lib/get-cached-user-goals";
import { getCurrentSession } from "@/app/lib/get-current-session";
import GoalsPageClient from "./goals-page-client";

export default function GoalsPage() {
  return (
    <Suspense
      fallback={
        <GoalsPageClient
          canPersist={false}
          initialGoals={{
            dailyCalorieGoal: null,
            dailyProteinGoal: null,
            dailyCarbsGoal: null,
            dailyFatGoal: null,
          }}
          isLoading
        />
      }
    >
      <GoalsPageContent />
    </Suspense>
  );
}

async function GoalsPageContent() {
  const session = await getCurrentSession();
  const goals = session?.user?.email
    ? await getCachedUserGoals(session.user.email)
    : null;

  return (
    <GoalsPageClient
      canPersist={Boolean(session?.user)}
      initialGoals={{
        dailyCalorieGoal: goals?.dailyCalorieGoal ?? null,
        dailyProteinGoal: goals?.dailyProteinGoal ?? null,
        dailyCarbsGoal: goals?.dailyCarbsGoal ?? null,
        dailyFatGoal: goals?.dailyFatGoal ?? null,
      }}
    />
  );
}
