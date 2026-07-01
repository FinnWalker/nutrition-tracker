"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    // We intentionally wait until after mount before rendering theme-dependent UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-11 w-32 rounded-full border border-border bg-surface"
      />
    );
  }

  const activeTheme = resolvedTheme === "dark" ? "dark" : "light";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";
  const Icon = activeTheme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
      className="inline-flex h-11 items-center gap-2 rounded-full 
      border border-border bg-surface px-4 text-sm font-medium text-foreground 
      shadow-soft transition-colors hover:border-brand hover:text-brand-foreground"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="capitalize">{activeTheme} mode</span>
    </button>
  );
}
