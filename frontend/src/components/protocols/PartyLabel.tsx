
type Role = "alice" | "bob" | "eve" | "source"

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: string }> = {
  alice:  { label: "ALICE",  color: "var(--accent-blue)",   icon: "👩‍💻" },
  bob:    { label: "BOB",    color: "var(--accent-purple)", icon: "👨‍💻" },
  eve:    { label: "EVE",    color: "var(--accent-red)",    icon: "🕵️" },
  source: { label: "SOURCE", color: "var(--accent-green)",  icon: "⚛" },
}

interface PartyLabelProps {
  role: Role
  subtitle?: string
  status?: string
  statusColor?: string
}

/**
 * Reusable party badge header for protocol zones.
 */
export function PartyLabel({ role, subtitle, status, statusColor }: PartyLabelProps) {
  const cfg = ROLE_CONFIG[role]
  return (
    <div style={{
      padding: "10px 14px",
      borderBottom: "1px solid var(--border)",
      background: `color-mix(in srgb, ${cfg.color} 4%, transparent)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{cfg.icon}</span>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)",
            color: cfg.color, letterSpacing: 1,
          }}>
            {cfg.label}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
        {status && (
          <div style={{
            marginLeft: "auto",
            fontSize: 9, fontFamily: "var(--font-mono)",
            color: statusColor ?? "var(--text-muted)",
            padding: "2px 7px",
            background: `color-mix(in srgb, ${statusColor ?? cfg.color} 10%, transparent)`,
            borderRadius: "var(--radius-sm)",
            border: `1px solid color-mix(in srgb, ${statusColor ?? cfg.color} 25%, transparent)`,
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}
