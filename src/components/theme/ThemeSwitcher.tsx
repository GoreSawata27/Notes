"use client";

import { usePathname } from "next/navigation";
import { DARK_THEME, LIGHT_THEME } from "@/lib/theme/themes";
import { useTheme } from "./ThemeProvider";

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-switcher-icon">
      <path fill="currentColor" d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 11.3 21a8.4 8.4 0 0 0 9.7-6.7Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="theme-switcher-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function ThemeSwitcher() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  if (pathname.startsWith("/preview")) return null;

  const isDark = theme === DARK_THEME;

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="theme-switcher-button"
        onClick={() => setTheme(isDark ? LIGHT_THEME : DARK_THEME)}
        aria-label={isDark ? "Switch to Notion Studio" : "Switch to Vercel Midnight"}
        title={isDark ? "Notion Studio" : "Vercel Midnight"}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
