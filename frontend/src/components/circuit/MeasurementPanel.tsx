import { useSimStore } from "@/store/simStore"
import { formatBasisState } from "@/lib/quantum/stateVector"
import { useCircuitStore } from "@/store/circuitStore"
import { useMemo } from "react"

export function MeasurementPanel() {
  const result = useSimStore(s => s.result)
  const nQubits = useCircuitStore(s => s.nQubits)
  const engineUsed = useSimStore(s => s.engineUsed)

  const bars = useMemo(() => {
    if (!result?.probabilities) return []
    return result.probabilities
      .map((p: number, i: number) => ({ p, label: formatBasisState(i, nQubits), i }))
      .filter((b: any) => b.p > 0.001)
      .sort((a: any, b: any) => b.p - a.p)
      .slice(0, 24)
  }, [result, nQubits])

  if (!result || bars.length === 0) return null

  const maxP = Math.max(...bars.map((b: any) => b.p))

  return (
    <div style={{
      borderTop: "1px solid var(--border)", background: "var(--bg-secondary)",
      padding: "8px 14px", flexShrink: 0, maxHeight: 130, overflow: "auto",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", marginBottom: 6,
        alignItems: "center",
      }}>
        <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          PROBABILITIES
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {engineUsed && (
            <span style={{
              fontSize: 8, color: "var(--accent-green)", fontFamily: "var(--font-mono)",
              padding: "1px 5px", background: "rgba(76,175,80,0.08)",
              borderRadius: 3, border: "1px solid rgba(76,175,80,0.15)",
            }}>{engineUsed}</span>
          )}
          <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            fidelity {((result.fidelity ?? 1) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", flexWrap: "wrap" }}>
        {bars.map(({ p, label }: any) => {
          const barH = Math.max(3, (p / maxP) * 52)
          const color = p > 0.5 ? "var(--accent-cyan)"
                      : p > 0.2 ? "var(--accent-blue)"
                      : "var(--border-bright)"
          return (
            <div key={label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}>
              <span style={{
                fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--text-secondary)",
              }}>
                {(p * 100).toFixed(0)}%
              </span>
              <div style={{
                width: 8, height: barH, background: color,
                borderRadius: "2px 2px 0 0", transition: "height 0.3s ease",
                boxShadow: p > 0.3 ? `0 0 6px ${color}88` : "none",
              }} />
              <span style={{
                fontSize: 7, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
                writingMode: bars.length > 8 ? "vertical-lr" : undefined as any,
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
