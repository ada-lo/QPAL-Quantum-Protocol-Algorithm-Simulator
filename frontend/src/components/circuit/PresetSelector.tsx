
import { useCircuitStore } from "@/store/circuitStore"
import { PRESETS } from "@/lib/quantum/presets"
import { useState, useRef, useEffect } from "react"

export function PresetSelector() {
  const { loadPreset } = useCircuitStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        padding: "4px 10px", fontSize: 12,
        background: "var(--bg-card)", color: "var(--text-secondary)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        Presets ▾
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: "var(--bg-panel)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: 6, zIndex: 100,
          minWidth: 210, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => { loadPreset(p.gates, p.nQubits); setOpen(false) }}
              style={{
                display: "block", width: "100%", padding: "8px 10px",
                textAlign: "left", borderRadius: "var(--radius-md)",
                background: "transparent", transition: "background var(--transition)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 1 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {p.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
