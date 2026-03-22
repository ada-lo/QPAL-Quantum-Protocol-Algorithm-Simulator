import { useLocation } from "react-router-dom"
import { StreamStatus } from "./StreamStatus"

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Overview",
    subtitle: "A simpler entry point into the project, the simulator, and the learning tools.",
  },
  "/simulator": {
    title: "Circuit Studio",
    subtitle: "Build a circuit, inspect the state, and connect each gate to an idea.",
  },
  "/protocols": {
    title: "Protocol Lessons",
    subtitle: "Follow communication and cryptography protocols through guided visual flows.",
  },
  "/algorithms": {
    title: "Algorithm Lessons",
    subtitle: "Study how quantum routines move from state preparation to measured outcome.",
  },
}

export function TopBar() {
  const { pathname } = useLocation()
  const meta = PAGE_META[pathname] ?? PAGE_META["/"]

  return (
    <header
      style={{
        minHeight: 72,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 22px",
        background: "rgba(251, 248, 241, 0.88)",
        backdropFilter: "blur(12px)",
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
          {pathname === "/" ? "WELCOME" : "WORKSPACE"}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{meta.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 640 }}>{meta.subtitle}</div>
      </div>
      <StreamStatus />
    </header>
  )
}
