"use client";

import { useEffect, useId, useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "./navigation-items";
import NavSidebar from "./NavSidebar";

const BottomNav = () => {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const drawerId = useId();
  const primaryItems = navigationItems.slice(0, 3);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-4 px-2 pb-2 pt-2">
          {primaryItems.map((item) => {
            const href = item.href || "/";
            const isActive = pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-3 py-2 text-[0.72rem] font-semibold ${
                  isActive
                    ? "text-brand-foreground"
                    : "text-foreground-muted"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            aria-controls={drawerId}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label={isMoreOpen ? "Close more navigation" : "Open more navigation"}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 px-3 py-2 text-[0.72rem] font-semibold ${
              isMoreOpen
                ? "text-brand-foreground"
                : "text-foreground-muted"
            }`}
            onClick={() => setIsMoreOpen((open) => !open)}
          >
            <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {isMoreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close more navigation"
            className="absolute inset-0 bg-slate-950/24 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />

          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            className="relative h-full w-full max-w-[17rem] border-r border-border bg-white shadow-2xl"
            onClickCapture={(event) => {
              const target = event.target;

              if (target instanceof Element && target.closest("a")) {
                setIsMoreOpen(false);
              }
            }}
          >
            <NavSidebar />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default BottomNav;
