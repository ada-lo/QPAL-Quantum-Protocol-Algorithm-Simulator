import type { CSSProperties } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { getStoredAppMode, resolveModeSwitchPath, setStoredAppMode, type AppMode } from "@/lib/appMode"

interface AppModeToggleProps {
  mode?: AppMode
  style?: CSSProperties
}

export function AppModeToggle({ mode = getStoredAppMode(), style }: AppModeToggleProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentMode =
    location.pathname.startsWith("/explore") || location.pathname.startsWith("/workspace")
      ? "researcher"
      : location.pathname.startsWith("/learn")
        ? "learner"
        : mode

  function handleSwitch(nextMode: AppMode) {
    if (nextMode === currentMode) return
    setStoredAppMode(nextMode)
    navigate(resolveModeSwitchPath(location.pathname, nextMode), { replace: true })
  }

  return (
    <div style={{ ...toggleShellStyle, ...style }}>
      <button
        type="button"
        onClick={() => handleSwitch("learner")}
        style={{
          ...toggleButtonStyle,
          ...(currentMode === "learner" ? activeToggleStyle : inactiveToggleStyle),
        }}
      >
        Learner
      </button>
      <button
        type="button"
        onClick={() => handleSwitch("researcher")}
        style={{
          ...toggleButtonStyle,
          ...(currentMode === "researcher" ? activeToggleStyle : inactiveToggleStyle),
        }}
      >
        Researcher
      </button>
    </div>
  )
}

const toggleShellStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 4,
}

const toggleButtonStyle: CSSProperties = {
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
  transition: "background var(--transition), color var(--transition), border-color var(--transition)",
}

const activeToggleStyle: CSSProperties = {
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
}

const inactiveToggleStyle: CSSProperties = {
  background: "transparent",
  color: "var(--text-secondary)",
}
