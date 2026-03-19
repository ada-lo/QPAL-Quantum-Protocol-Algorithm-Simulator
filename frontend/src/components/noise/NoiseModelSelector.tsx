
import { useNoise } from "@/hooks/useNoise"
import { useNoiseStore } from "@/store/noiseStore"
import { NOISE_MODELS, type NoiseModelId } from "@/lib/noise/models"

export function NoiseModelSelector() {
  const { activeModel, model, setParam } = useNoise()
  const setActiveModel = useNoiseStore(s => s.setActiveModel)
  const params = useNoiseStore(s => s.params)

  return (
    <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid var(--border)" }}>
      {/* Model buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {NOISE_MODELS.map(m => {
          const active = activeModel === m.id
          return (
            <button key={m.id} onClick={() => setActiveModel(m.id as NoiseModelId)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                borderRadius: "var(--radius-md)",
                background: active ? `${m.color}12` : "transparent",
                border: `1px solid ${active ? m.color : "transparent"}`,
                textAlign: "left", transition: "all var(--transition)",
                cursor: "pointer",
              }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: active ? m.color : "var(--border-bright)",
                flexShrink: 0, transition: "background var(--transition)",
                boxShadow: active ? `0 0 6px ${m.color}` : "none",
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? m.color : "var(--text-primary)",
                  transition: "color var(--transition)",
                }}>{m.label}</div>
                {active && (
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1, lineHeight: 1.4 }}>
                    {m.description}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Params for active model */}
      {model.params.length > 0 && (
        <div style={{
          marginTop: 12, padding: "10px 12px",
          background: "var(--bg-card)", borderRadius: "var(--radius-md)",
          border: `1px solid ${model.color}33`,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {model.params.map(p => {
            const val = params[p.key] ?? p.default
            return (
              <div key={p.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.label}</span>
                  <span style={{
                    fontSize: 11, fontFamily: "var(--font-mono)",
                    color: model.color, fontWeight: 600,
                  }}>
                    {p.unit === "μs" || p.unit === "ns"
                      ? `${val}${p.unit}`
                      : val.toFixed(p.step < 0.01 ? 3 : p.step < 0.1 ? 2 : 1)}
                  </span>
                </div>
                <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
                  <input type="range" min={p.min} max={p.max} step={p.step}
                    value={val}
                    onChange={e => setParam(p.key, Number(e.target.value))}
                    style={{ width: "100%", accentColor: model.color, cursor: "pointer" }}
                  />
                </div>
                {/* Mini track labels */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {p.min}{p.unit}
                  </span>
                  <span style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {p.max}{p.unit}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
