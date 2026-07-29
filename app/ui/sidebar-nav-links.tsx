"use client";

import { CalendarDays, ChefHat, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  {
    href: "/food-library",
    label: "Saved Foods",
    icon: ChefHat,
  },
] as const;

export default function SidebarNavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 border px-3 py-2 text-sm ${
              isActive
                ? "border-border bg-brand-muted text-brand-foreground"
                : "border-transparent text-foreground-muted"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
