import { NavLink } from "react-router-dom"
import { BookOpen, Cpu, FlaskConical, Workflow } from "lucide-react"

const NAV = [
  {
    to: "/",
    icon: BookOpen,
    label: "Overview",
    blurb: "Start here for the simplest route into the simulator",
  },
  {
    to: "/simulator",
    icon: Cpu,
    label: "Circuit Studio",
    blurb: "Build circuits, inspect states, and compare visual views",
  },
  {
    to: "/protocols",
    icon: Workflow,
    label: "Protocols",
    blurb: "Study BB84, teleportation, superdense coding, and more",
  },
  {
    to: "/algorithms",
    icon: FlaskConical,
    label: "Algorithms",
    blurb: "Explore search, phase, variational, and walk-based methods",
  },
]

export function Sidebar() {
  return (
    <aside
      style={{
        width: 264,
        background: "rgba(251, 248, 241, 0.82)",
        border: "1px solid rgba(216, 205, 185, 0.9)",
        borderRadius: "var(--radius-xl)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        boxShadow: "var(--shadow-soft)",
        backdropFilter: "blur(14px)",
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "6px 4px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "var(--accent-cyan)",
            display: "grid",
            placeItems: "center",
            color: "#f7f2e8",
            fontFamily: "var(--font-serif)",
            fontSize: 18,
            marginBottom: 12,
          }}
        >
          q
        </div>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 6 }}>
          QUANTUM LEARNING WORKSPACE
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, color: "var(--text-primary)" }}>
          Protocol and algorithm intuition,
          <br />
          without the clutter.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        {NAV.map(({ to, icon: Icon, label, blurb }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "grid",
              gridTemplateColumns: "36px 1fr",
              gap: 12,
              alignItems: "start",
              padding: "12px 12px 12px 10px",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              border: `1px solid ${isActive ? "rgba(45, 106, 90, 0.28)" : "transparent"}`,
              background: isActive ? "rgba(45, 106, 90, 0.08)" : "transparent",
              transition: "all var(--transition)",
            })}
          >
            {({ isActive }) => (
              <>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: isActive ? "var(--accent-cyan)" : "var(--bg-card)",
                    color: isActive ? "#f8f3eb" : "var(--text-secondary)",
                    border: `1px solid ${isActive ? "var(--accent-cyan)" : "var(--border)"}`,
                  }}
                >
                  <Icon size={17} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isActive ? "var(--accent-cyan)" : "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.45, color: "var(--text-secondary)" }}>{blurb}</div>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: 14,
          borderRadius: "var(--radius-md)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 6 }}>
          QUICK INTENT
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-secondary)" }}>
          Choose an experience, load the circuit, then use the visual tabs to connect the gates with the idea behind them.
        </div>
      </div>
    </aside>
  )
}
