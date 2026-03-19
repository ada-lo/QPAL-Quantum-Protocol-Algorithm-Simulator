
import { useNoise } from "@/hooks/useNoise"
import { useNoiseStore } from "@/store/noiseStore"
import { useSimStore } from "@/store/simStore"

export function DecoherencePanel() {
  const { model } = useNoise()
  const params = useNoiseStore(s => s.params)
  const result = useSimStore(s => s.result)
  const fidelity = result?.fidelity ?? 1.0

  const fColor = fidelity > 0.9 ? "var(--accent-green)"
               : fidelity > 0.6 ? "var(--accent-amber)"
               : "var(--accent-red)"

  // Model-specific stats
  const stats: { label: string; value: string; sub?: string }[] = [
    { label: "Fidelity", value: `${(fidelity * 100).toFixed(1)}%` },
  ]

  if (model.id === "depolarizing") {
    const p = params.p ?? 0.01
    stats.push({ label: "Error prob", value: `${(p * 100).toFixed(2)}%`, sub: "per gate" })
    stats.push({ label: "Gate fid.", value: `${((1 - p) * 100).toFixed(2)}%` })
  } else if (model.id === "amplitude_damping") {
    const γ = params.gamma ?? 0.05
    stats.push({ label: "T1 decay γ", value: γ.toFixed(3), sub: "per gate" })
    stats.push({ label: "Excit. surv.", value: `${((1 - γ) * 100).toFixed(1)}%` })
  } else if (model.id === "phase_flip") {
    const p = params.p ?? 0.02
    stats.push({ label: "Phase err", value: `${(p * 100).toFixed(2)}%`, sub: "per gate" })
    stats.push({ label: "Coherence", value: `${((1 - 2*p) * 100).toFixed(1)}%` })
  } else if (model.id === "thermal") {
    const t1 = params.t1 ?? 100
    const t2 = params.t2 ?? 80
    stats.push({ label: "T1", value: `${t1} μs`, sub: "relaxation" })
    stats.push({ label: "T2", value: `${t2} μs`, sub: "dephasing" })
    stats.push({ label: "T2/T1", value: (t2/t1).toFixed(2), sub: t2 <= 2*t1 ? "valid" : "⚠ T2>2T1" })
  }

  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 10 }}>
        CHANNEL PARAMETERS
      </div>

      {/* Fidelity bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Circuit fidelity</span>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: fColor }}>
            {(fidelity * 100).toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${fidelity * 100}%`,
            background: fColor,
            borderRadius: 3, transition: "width 0.5s ease",
            boxShadow: `0 0 8px ${fColor}66`,
          }}/>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {stats.map(({ label, value, sub }) => (
          <div key={label} style={{
            background: "var(--bg-card)", borderRadius: "var(--radius-md)",
            padding: "8px 8px 6px", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: model.color, fontFamily: "var(--font-mono)" }}>
              {value}
            </div>
            {sub && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
