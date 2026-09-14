"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/preview")) {
    return children;
  }
  return (
    <ThemeProvider>
      {children}
      <ThemeSwitcher />
    </ThemeProvider>
  );
}
