import { Suspense } from "react";
import NavbarAuth from "./navbar-auth";
import SidebarNavLinks from "./sidebar-nav-links";
import ThemeToggle from "./theme-toggle";

export default function SidebarNav() {
  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-foreground-muted">
              Wellness
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Nutrition Tracker
            </h1>
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>

        <Suspense fallback={<NavbarAuthFallback />}>
          <NavbarAuth />
        </Suspense>
      </div>

      <SidebarNavLinks />
    </>
  );
}

function NavbarAuthFallback() {
  return (
    <div
      aria-hidden="true"
      className="h-[4.5rem] rounded-2xl border border-border bg-surface-elevated shadow-soft"
    />
  );
}
