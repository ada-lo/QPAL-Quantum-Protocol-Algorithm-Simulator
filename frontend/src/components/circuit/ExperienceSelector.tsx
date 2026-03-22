import { useEffect, useRef, useState } from "react"
import { LEARNING_EXPERIENCES } from "@/lib/quantum/learningCatalog"
import { useLearningStore } from "@/store/learningStore"

export function ExperienceSelector() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selectedId = useLearningStore((s) => s.selectedId)
  const loadIntoCircuit = useLearningStore((s) => s.loadIntoCircuit)
  const current = LEARNING_EXPERIENCES.find((item) => item.id === selectedId) ?? LEARNING_EXPERIENCES[0]

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          background: "var(--bg-card)",
          color: current.accent,
          border: `1px solid ${current.accent}55`,
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Learn: {current.label}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: 8,
            zIndex: 120,
            minWidth: 320,
            maxHeight: 420,
            overflow: "auto",
            boxShadow: "0 12px 30px rgba(0,0,0,0.38)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              padding: "2px 6px 8px",
            }}
          >
            LOAD A PROTOCOL OR ALGORITHM INTO THE CIRCUIT SIMULATOR
          </div>
          {LEARNING_EXPERIENCES.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                loadIntoCircuit(item.id)
                setOpen(false)
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                textAlign: "left",
                borderRadius: "var(--radius-md)",
                background: item.id === current.id ? `${item.accent}12` : "transparent",
                border: `1px solid ${item.id === current.id ? `${item.accent}40` : "transparent"}`,
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.accent }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    color: item.accent,
                    border: `1px solid ${item.accent}35`,
                    background: `${item.accent}12`,
                    borderRadius: 999,
                    padding: "1px 6px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.kind}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
                {item.summary}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 9, fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--text-muted)" }}>{item.nQubits}q</span>
                <span
                  style={{
                    color:
                      item.support === "implemented"
                        ? "var(--accent-green)"
                        : item.support === "demo"
                          ? "var(--accent-amber)"
                          : "var(--accent-red)",
                  }}
                >
                  {item.support}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
