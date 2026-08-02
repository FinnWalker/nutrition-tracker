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
    <nav aria-label="Primary" className="flex flex-col gap-1.5">
      {navigationItems.map((item) => {
        const href = `${basePath}${item.href}` || "/";
        const isActive = pathname === href;
        const Icon = item.icon;

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[1rem] font-bold transition-colors ${
              isActive
                ? "bg-brand-muted text-brand-foreground"
                : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            <Icon className="h-5.5 w-5.5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
