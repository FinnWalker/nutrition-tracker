"use client";

import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";

type MobileNavDrawerProps = {
  children: React.ReactNode;
};

export default function MobileNavDrawer(props: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4 md:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
            Wellness
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Nutrition Tracker
          </h1>
        </div>

        <button
          type="button"
          aria-controls={drawerId}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-11 w-11 items-center justify-center border border-border bg-surface text-foreground"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative ml-auto flex h-full w-full max-w-xs flex-col border-l border-border bg-surface px-5 py-6 shadow-2xl"
            onClickCapture={(event) => {
              const target = event.target;

              if (target instanceof Element && target.closest("a")) {
                setIsOpen(false);
              }
            }}
          >
            {props.children}
          </div>
        </div>
      ) : null}
    </>
  );
}
