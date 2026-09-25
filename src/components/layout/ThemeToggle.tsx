"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="grid h-9 w-9 place-items-center rounded-full text-fg-muted transition hover:bg-muted hover:text-fg"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {/* Both icons render; CSS picks one so there's no hydration flash. */}
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
      <Moon className="h-[18px] w-[18px] dark:hidden" />
    </button>
  );
}
