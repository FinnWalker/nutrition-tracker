"use client";

import { CalendarDays, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavbarAuth from "./navbar-auth";
import ThemeToggle from "./theme-toggle";

const navigationItems = [
  {
    href: "/",
    label: "Overview",
    icon: House,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: CalendarDays,
  },
] as const;

export default function SidebarNav() {
  const pathname = usePathname();

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

        <NavbarAuth />
      </div>
      <nav aria-label="Primary" className="flex flex-col gap-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-14 items-center gap-3 rounded-2xl border px-4 py-2.5 text-md font-medium transition-colors ${
                isActive
                  ? "border-border-strong bg-brand-muted text-brand-foreground shadow-accent"
                  : "border-transparent text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              <span className="shrink-0">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
