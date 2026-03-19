
import { useSimStore } from "@/store/simStore"
import { formatBasisState } from "@/lib/quantum/stateVector"
import { useCircuitStore } from "@/store/circuitStore"
import { useMemo } from "react"

export function MeasurementPanel() {
  const result = useSimStore(s => s.result)
  const nQubits = useCircuitStore(s => s.nQubits)

  const bars = useMemo(() => {
    if (!result) return []
    return result.probabilities
      .map((p, i) => ({ p, label: formatBasisState(i, nQubits), i }))
      .filter(b => b.p > 0.001)
      .sort((a, b) => b.p - a.p)
      .slice(0, 20)
  }, [result, nQubits])

  if (!result) return null

  const maxP = Math.max(...bars.map(b => b.p))

  return (
    <div style={{
      borderTop: "1px solid var(--border)", background: "var(--bg-secondary)",
      padding: "10px 14px", flexShrink: 0, maxHeight: 140, overflow: "auto",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", marginBottom: 8,
        alignItems: "center",
      }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          PROBABILITIES
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          fidelity {(result.fidelity * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
        {bars.map(({ p, label }) => {
          const barH = Math.max(4, (p / maxP) * 56)
          const color = p > 0.5 ? "var(--accent-cyan)"
                      : p > 0.2 ? "var(--accent-blue)"
                      : "var(--border-bright)"
          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                {(p * 100).toFixed(0)}%
              </span>
              <div style={{
                width: 10, height: barH, background: color,
                borderRadius: "2px 2px 0 0", transition: "height 0.3s ease",
                boxShadow: p > 0.3 ? `0 0 6px ${color}88` : "none",
              }} />
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
