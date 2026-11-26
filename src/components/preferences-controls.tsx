"use client";

import { Moon, Sun } from "lucide-react";
import { usePreferences } from "./preferences-provider";

export function PreferencesControls() {
  const { lang, theme, toggleLang, toggleTheme } = usePreferences();

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleLang}
        aria-label="สลับภาษา"
        className="inline-flex min-h-[36px] items-center rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-2.5 text-xs font-semibold text-[var(--birthday-text)] transition-colors hover:bg-[var(--birthday-soft)]"
      >
        {lang === "th" ? "TH" : "EN"}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="สลับโหมดสี"
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] text-[var(--birthday-text)] transition-colors hover:bg-[var(--birthday-soft)]"
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </div>
  );
}
