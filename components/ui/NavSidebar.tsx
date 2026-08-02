import { Leaf } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import NavbarAuth from "@/app/ui/navbar-auth";
import SidebarNavLinks from "@/app/ui/sidebar-nav-links";

type NavSidebarProps = {
  basePath?: string;
};

const NavSidebar = ({ basePath }: NavSidebarProps) => {
  return (
    <div className="flex h-full flex-col p-5">
      <div className="space-y-8">
        <div className="text-center">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex justify-end pr-2.5">
              <Leaf
                className="h-5 w-5 fill-emerald-500 text-emerald-500"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-center text-[1.7rem] font-bold tracking-tight text-foreground">
              NutriTrack
            </h2>
            <div aria-hidden="true" />
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground-muted">
            Track food. Reach goals.
          </p>
        </div>
        <SidebarNavLinks basePath={basePath} />
        <section className="rounded-[1.4rem] bg-brand-muted p-4">
          <p className="text-sm font-bold text-brand-foreground">
            Build your library
          </p>
          <p className="mt-1 text-xs leading-5 text-foreground-muted">
            Save your favorite foods and scan labels with AI.
          </p>
          <Link
            href="/add-food"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            + Add Food
          </Link>
        </section>
      </div>
      <div className="mt-auto pt-6">
        <Suspense fallback={<NavbarAuthFallback />}>
          <NavbarAuth />
        </Suspense>
      </div>
    </div>
  );
};

export default NavSidebar;

function NavbarAuthFallback() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-3 rounded-[1.45rem] border border-border bg-white px-3.5 py-3 shadow-sm"
    >
      <div className="h-11 w-11 shrink-0 rounded-full bg-surface-elevated" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-16 rounded-full bg-surface-elevated" />
        <div className="h-3 w-14 rounded-full bg-surface-elevated" />
      </div>
      <div className="h-9 w-9 shrink-0 rounded-xl bg-surface-elevated" />
    </div>
  );
}
