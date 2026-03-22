import { useCircuitStore } from "@/store/circuitStore"
import { useLocalSim } from "@/hooks/useLocalSim"
import { useUndoRedo } from "@/hooks/useUndoRedo"
import { useUrlCircuit } from "@/hooks/useUrlCircuit"
import { GatePanel, GatePanelBottom } from "./GatePanel"
import { CircuitGrid } from "./CircuitGrid"
import { CircuitLessonBanner } from "./CircuitLessonBanner"
import { MeasurementPanel } from "./MeasurementPanel"
import { ExperienceSelector } from "./ExperienceSelector"
import { PresetSelector } from "./PresetSelector"
import { PlaybackControls } from "./PlaybackControls"

export function CircuitBuilder() {
  const { nQubits, setNQubits, clearCircuit, undo, redo, undoStack, redoStack } = useCircuitStore()
  useLocalSim()
  useUndoRedo()
  useUrlCircuit()

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>QUBITS</span>
        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
          <button
            key={n}
            onClick={() => setNQubits(n)}
            style={{
              width: 28,
              height: 22,
              borderRadius: 3,
              fontSize: 11,
              fontWeight: n === nQubits ? 700 : 400,
              background: n === nQubits ? "var(--accent-cyan)" : "var(--bg-card)",
              color: n === nQubits ? "#000" : "var(--text-secondary)",
              border: `1px solid ${n === nQubits ? "var(--accent-cyan)" : "var(--border)"}`,
              transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        ))}
        {nQubits > 6 && (
          <span
            style={{
              fontSize: 9,
              color: "var(--accent-cyan)",
              fontFamily: "var(--font-mono)",
              padding: "1px 5px",
              background: "rgba(0,212,255,0.08)",
              borderRadius: 3,
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            QDD
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
          style={{
            padding: "3px 8px",
            fontSize: 12,
            color: undoStack.length ? "var(--text-secondary)" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 3,
            background: "transparent",
            opacity: undoStack.length ? 1 : 0.4,
          }}
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Y)"
          style={{
            padding: "3px 8px",
            fontSize: 12,
            color: redoStack.length ? "var(--text-secondary)" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 3,
            background: "transparent",
            opacity: redoStack.length ? 1 : 0.4,
          }}
        >
          Redo
        </button>

        <PresetSelector />
        <ExperienceSelector />

        <button
          onClick={clearCircuit}
          title="Clear circuit"
          style={{
            padding: "3px 10px",
            fontSize: 11,
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 3,
            background: "transparent",
          }}
        >
          Clear
        </button>

        <span
          style={{
            fontSize: 9,
            color: "var(--accent-green)",
            fontFamily: "var(--font-mono)",
            padding: "1px 6px",
            background: "rgba(76,175,80,0.08)",
            borderRadius: 3,
            border: "1px solid rgba(76,175,80,0.2)",
          }}
        >
          Real-time
        </span>
      </div>

      <CircuitLessonBanner />

      <GatePanel />

      <div style={{ flex: 1, overflow: "auto" }}>
        <CircuitGrid />
      </div>

      <GatePanelBottom />
      <PlaybackControls />
      <MeasurementPanel />
    </div>
  )
}
