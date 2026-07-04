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
      className="inline-flex h-9 w-9 items-center justify-center border border-border bg-surface text-foreground"
    >
      {mounted ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <span aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  );
}
