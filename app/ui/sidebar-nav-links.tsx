"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/components/ui/navigation-items";

type SidebarNavLinksProps = {
  basePath?: string;
};

export default function SidebarNavLinks({
  basePath = "",
}: SidebarNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {navigationItems.map((item) => {
        const href = `${basePath}${item.href}` || "/";
        const isActive = pathname === href;
        const Icon = item.icon;

        return (
          <Link
            key={href}
            href={href}
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
