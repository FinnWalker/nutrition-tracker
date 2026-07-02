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

  const activeTheme = resolvedTheme === "dark" ? "dark" : "light";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";
  const Icon = activeTheme === "dark" ? Sun : Moon;
  const buttonLabel = mounted ? `Switch to ${nextTheme} mode` : "Toggle theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={buttonLabel}
      title={buttonLabel}
      disabled={!mounted}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-soft transition-colors hover:border-brand hover:text-brand-foreground"
    >
      {mounted ? (
        <Icon
          className="h-4 w-4 opacity-100 transition-opacity duration-200"
          aria-hidden="true"
        />
      ) : (
        <span aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  );
}
