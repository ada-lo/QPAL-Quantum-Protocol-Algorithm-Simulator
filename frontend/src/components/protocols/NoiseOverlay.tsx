
import { useState } from "react"
import { useNoise } from "@/hooks/useNoise"
import { useNoiseStore } from "@/store/noiseStore"
import type { NoiseModelId } from "@/lib/noise/models"

/**
 * Compact noise overlay panel that can be embedded in any protocol page.
 * Shows a mini noise model selector, Bloch ball purity indicator,
 * and fidelity impact summary — all in a collapsible drawer.
 */
export function NoiseOverlay() {
  const [open, setOpen] = useState(false)
  const { model, allModels } = useNoise()
  const { activeModel, params, setActiveModel, setParam } = useNoiseStore()
  const isNoisy = activeModel !== "ideal"

  // Compute purity for display
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
          {isNoisy && (
            <span style={{
              fontSize: 9, color: "var(--accent-amber)", fontFamily: "var(--font-mono)",
              padding: "1px 5px", background: "rgba(245,158,11,0.1)",
              borderRadius: 3, border: "1px solid rgba(245,158,11,0.2)",
            }}>
              GAP 2
            </span>
          )}
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          {/* Model selector row */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
            {allModels.map(m => (
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
