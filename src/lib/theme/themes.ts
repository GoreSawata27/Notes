export const THEME_IDS = ["notion-studio", "vercel-midnight"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "notion-studio";
export const LIGHT_THEME: ThemeId = "notion-studio";
export const DARK_THEME: ThemeId = "vercel-midnight";

export const THEME_STORAGE_KEY = "notes-theme";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  shikiTheme: string;
};

export const THEMES: ThemeMeta[] = [
  { id: "notion-studio", label: "Notion Studio", shikiTheme: "catppuccin-latte" },
  { id: "vercel-midnight", label: "Vercel Midnight", shikiTheme: "github-dark" },
];

export function isThemeId(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function getShikiTheme(themeId: ThemeId): string {
  return THEMES.find((theme) => theme.id === themeId)?.shikiTheme ?? "github-light";
}

export const SHIKI_THEMES = [...new Set(THEMES.map((theme) => theme.shikiTheme))];
