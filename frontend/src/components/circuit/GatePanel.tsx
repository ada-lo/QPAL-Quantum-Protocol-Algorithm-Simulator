
import { useCircuitStore } from "@/store/circuitStore"
import { GATES, SINGLE_QUBIT_GATES, TWO_QUBIT_GATES, type GateId } from "@/lib/quantum/gates"

const CATEGORIES = [
  { label: "Single qubit", ids: SINGLE_QUBIT_GATES },
  { label: "Two qubit",    ids: TWO_QUBIT_GATES },
]

export function GatePanel() {
  const { selectedGate, setSelectedGate, pendingConnection } = useCircuitStore()

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, padding: "6px 14px",
      borderBottom: "1px solid var(--border)", background: "var(--bg-panel)",
      flexShrink: 0, flexWrap: "wrap",
    }}>
      {CATEGORIES.map(cat => (
        <div key={cat.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {cat.label}
          </span>
          {cat.ids.map(id => {
            const g = GATES[id as GateId]
            const active = selectedGate === id
            return (
              <button key={id} title={g.description}
                onClick={() => setSelectedGate(active ? null : id as GateId)}
                style={{
                  width: 38, height: 28, borderRadius: "var(--radius-sm)",
                  fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                  background: active ? g.color : "var(--bg-card)",
                  color: active ? "#fff" : g.color,
                  border: `1px solid ${active ? g.color : "rgba(255,255,255,0.1)"}`,
                  transition: "all var(--transition)",
                  boxShadow: active ? `0 0 10px ${g.color}55` : "none",
                }}>
                {g.label}
              </button>
            )
          })}
        </div>
      ))}

      {/* Active hint */}
      {selectedGate && (
        <div style={{
          marginLeft: "auto", fontSize: 11,
          color: GATES[selectedGate]?.color ?? "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
        }}>
          {pendingConnection
            ? `Click target qubit at step ${pendingConnection.step}`
            : `Click wire to place ${selectedGate}`}
          <button onClick={() => setSelectedGate(null)} style={{
            marginLeft: 8, fontSize: 11, color: "var(--text-muted)",
            border: "none", cursor: "pointer",
          }}>✕</button>
        </div>
      )}
    </div>
  )
}
