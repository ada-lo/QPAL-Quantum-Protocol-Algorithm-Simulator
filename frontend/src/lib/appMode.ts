export type AppMode = "learner" | "researcher"

export const APP_MODE_STORAGE_KEY = "qpal_mode"

export function getStoredAppMode(): AppMode {
  if (typeof window === "undefined") return "learner"
  const value = window.localStorage.getItem(APP_MODE_STORAGE_KEY)
  return value === "researcher" ? "researcher" : "learner"
}

export function setStoredAppMode(mode: AppMode) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(APP_MODE_STORAGE_KEY, mode)
}

export function toggleAppMode(mode: AppMode): AppMode {
  return mode === "learner" ? "researcher" : "learner"
}

export function resolveModeHome(mode: AppMode) {
  return mode === "learner" ? "/learn" : "/workspace"
}

export function resolveModeSwitchPath(pathname: string, nextMode: AppMode) {
  if (pathname.startsWith("/learn/")) {
    const topic = pathname.replace(/^\/learn\//, "")
    return nextMode === "learner" ? pathname : `/explore/${topic}`
  }

  if (pathname === "/learn") {
    return nextMode === "learner" ? "/learn" : "/explore"
  }

  if (pathname.startsWith("/explore/")) {
    const topic = pathname.replace(/^\/explore\//, "")
    return nextMode === "researcher" ? pathname : `/learn/${topic}`
  }

  if (pathname === "/explore") {
    return nextMode === "researcher" ? "/explore" : "/learn"
  }

  if (pathname === "/workspace") {
    return nextMode === "researcher" ? "/workspace" : "/learn"
  }

  if (pathname === "/mode" || pathname === "/app/mode") {
    return resolveModeHome(nextMode)
  }

  return pathname
}
