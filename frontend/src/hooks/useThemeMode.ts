import { useEffect, useState } from "react"

export type ThemeMode = "light" | "dark"

const THEME_STORAGE_KEY = "workspace-theme"

function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light"
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light"
}

function applyThemeMode(theme: ThemeMode) {
  if (typeof document === "undefined") return
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(readThemeMode)

  useEffect(() => {
    applyThemeMode(theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return { theme, setTheme }
}
