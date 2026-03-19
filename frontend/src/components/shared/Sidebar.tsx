import { NavLink } from "react-router-dom"
import { Cpu, FlaskConical, Workflow, BookOpen } from "lucide-react"

const NAV = [
  { to: "/",           icon: BookOpen,    label: "Home" },
  { to: "/simulator",  icon: Cpu,         label: "Circuit" },
  { to: "/protocols",  icon: Workflow,    label: "Protocols" },
  { to: "/algorithms", icon: FlaskConical,label: "Algorithms" },
]

export function Sidebar() {
  return (
    <nav style={{
      width: 56, background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "16px 0", gap: 4, flexShrink: 0,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "var(--radius-md)",
        background: "var(--accent-cyan)", display: "flex",
        alignItems: "center", justifyContent: "center",
        marginBottom: 16, flexShrink: 0,
      }}>
        <span style={{ fontSize: 16, filter: "brightness(0)" }}>⟨ψ⟩</span>
      </div>
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} title={label} style={({ isActive }) => ({
          width: 40, height: 40, borderRadius: "var(--radius-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
          background: isActive ? "var(--bg-hover)" : "transparent",
          textDecoration: "none", transition: "all var(--transition)",
        })}>
          <Icon size={18} />
        </NavLink>
      ))}
    </nav>
  )
}
