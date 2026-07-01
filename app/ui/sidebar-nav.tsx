"use client";

import { CalendarDays, House } from "lucide-react";
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
] as const;

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-center">
          Nutrition Tracker
        </h1>
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
              className={`flex items-center h-14 gap-3 rounded-xl px-3 py-2.5 text-md font-medium transition-colors ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="shrink-0 bg-red">
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
