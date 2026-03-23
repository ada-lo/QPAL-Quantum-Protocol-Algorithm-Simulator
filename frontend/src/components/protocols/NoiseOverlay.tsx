
import { useState } from "react"

/* ── Inline noise model definitions (noise system was removed) ── */
type NoiseModelId = "ideal" | "depolarizing" | "amplitude_damping" | "phase_flip" | "thermal"

interface NoiseParam { key: string; label: string; min: number; max: number; step: number; default: number; unit?: string }
interface NoiseModel { id: NoiseModelId; label: string; color: string; params: NoiseParam[] }

const NOISE_MODELS: NoiseModel[] = [
  { id: "ideal", label: "Ideal (no noise)", color: "var(--accent-green)", params: [] },
  { id: "depolarizing", label: "Depolarizing", color: "var(--accent-amber)", params: [{ key: "p", label: "Error probability", min: 0, max: 0.5, step: 0.01, default: 0.01 }] },
  { id: "amplitude_damping", label: "Amplitude Damping", color: "#e879f9", params: [{ key: "gamma", label: "Damping rate γ", min: 0, max: 1, step: 0.01, default: 0.05 }] },
  { id: "phase_flip", label: "Phase Flip", color: "#60a5fa", params: [{ key: "p", label: "Flip probability", min: 0, max: 0.5, step: 0.01, default: 0.02 }] },
  { id: "thermal", label: "Thermal Relaxation", color: "#f87171", params: [{ key: "t1", label: "T1 (μs)", min: 1, max: 500, step: 1, default: 100 }, { key: "tgate", label: "Gate time (ns)", min: 10, max: 500, step: 10, default: 50, unit: "ns" }] },
]

/**
 * Compact noise overlay panel that can be embedded in any protocol page.
 * Shows a mini noise model selector, purity indicator, and fidelity impact summary.
 */
export function NoiseOverlay() {
  const [open, setOpen] = useState(false)
  const [activeModel, setActiveModel] = useState<NoiseModelId>("ideal")
  const [params, setParams] = useState<Record<string, number>>({})

  const model = NOISE_MODELS.find(m => m.id === activeModel) ?? NOISE_MODELS[0]
  const isNoisy = activeModel !== "ideal"

  function setParam(key: string, val: number) {
    setParams(prev => ({ ...prev, [key]: val }))
  }

  const depth = 10
  const purity = computePurity(activeModel, params, depth)

  return (
    <div style={{
      position: "relative",
      borderTop: "1px solid var(--border)",
      background: "var(--bg-panel)",
    }}>
      {/* Toggle bar */}
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", background: "transparent", border: "none",
        cursor: "pointer", fontSize: 11,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isNoisy ? "var(--accent-amber)" : "var(--accent-green)",
            boxShadow: isNoisy ? "0 0 8px var(--accent-amber)" : "none",
          }} />
          <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            NOISE — {model.label}
          </span>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          {/* Model selector row */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
            {NOISE_MODELS.map(m => (
              <button key={m.id} onClick={() => setActiveModel(m.id)} style={{
                padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: 10,
                fontFamily: "var(--font-mono)",
                background: activeModel === m.id ? m.color : "var(--bg-card)",
                color: activeModel === m.id ? "#000" : "var(--text-secondary)",
                border: `1px solid ${activeModel === m.id ? m.color : "var(--border)"}`,
                fontWeight: activeModel === m.id ? 700 : 400,
                cursor: "pointer",
              }}>
                {m.id === "ideal" ? "OFF" : m.label.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Parameter sliders */}
          {isNoisy && model.params.map(p => (
            <div key={p.key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.label}</span>
                <span style={{
                  fontSize: 10, fontFamily: "var(--font-mono)",
                  color: model.color, fontWeight: 700,
                }}>
                  {(params[p.key] ?? p.default).toFixed(p.step < 0.01 ? 3 : p.step < 1 ? 2 : 0)}
                  {p.unit && ` ${p.unit}`}
                </span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step}
                value={params[p.key] ?? p.default}
                onChange={e => setParam(p.key, Number(e.target.value))}
                style={{ width: "100%", accentColor: model.color, height: 4 }} />
            </div>
          ))}

          {/* Impact summary */}
          {isNoisy && (
            <div style={{
              marginTop: 8, padding: "8px 10px",
              background: "var(--bg-card)", borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  PURITY at depth {depth}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                  color: purity > 0.7 ? "var(--accent-green)" : purity > 0.4 ? "var(--accent-amber)" : "var(--accent-red)",
                }}>
                  {(purity * 100).toFixed(1)}%
                </span>
              </div>
              {/* Mini purity bar */}
              <div style={{
                height: 4, borderRadius: 2,
                background: "var(--bg-hover)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${purity * 100}%`,
                  background: purity > 0.7 ? "var(--accent-green)" : purity > 0.4 ? "var(--accent-amber)" : "var(--accent-red)",
                  transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{
                marginTop: 6, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5,
              }}>
                {purity > 0.8 ?
                  "Noise has minimal effect — quantum advantage is maintained." :
                  purity > 0.5 ?
                  "Noticeable degradation — error correction would be needed for reliable results." :
                  "Severe decoherence — quantum state is nearly classical. Protocol reliability is compromised."
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function computePurity(modelId: NoiseModelId, params: Record<string, number>, depth: number): number {
  if (modelId === "depolarizing") {
    const p = params.p ?? 0.01
    return Math.max(0, (1 - 4*p/3) ** depth)
  }
  if (modelId === "amplitude_damping") {
    const g = params.gamma ?? 0.05
    return Math.max(0, (1 - g) ** (depth / 2))
  }
  if (modelId === "phase_flip") {
    const p = params.p ?? 0.02
    return Math.max(0, (1 - 2*p) ** depth)
  }
  if (modelId === "thermal") {
    const t1 = (params.t1 ?? 100) * 1e3
    const tg = params.tgate ?? 50
    return Math.max(0, Math.exp(-tg / t1) ** depth)
  }
  return 1.0
}
