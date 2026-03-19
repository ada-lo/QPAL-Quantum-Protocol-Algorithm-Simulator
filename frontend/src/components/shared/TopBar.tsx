import { useLocation } from "react-router-dom"
import { StreamStatus } from "./StreamStatus"

const TITLES: Record<string, string> = {
  "/": "Quantum Simulator",
  "/simulator": "Circuit Simulator",
  "/protocols": "Protocol Animator",
  "/algorithms": "Algorithm Explorer",
}

export function TopBar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? "Quantum Simulator"
  return (
    <header style={{
      height: 48, borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", background: "var(--bg-secondary)", flexShrink: 0,
    }}>
      <span style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 14 }}>
        {title}
      </span>
      <StreamStatus />
    </header>
  )
}
