import type { CSSProperties } from "react"

import { CircuitGrid } from "@/components/circuit/CircuitGrid"
import { GatePanel, GatePanelBottom } from "@/components/circuit/GatePanel"
import { MeasurementPanel } from "@/components/circuit/MeasurementPanel"
import { PlaybackControls } from "@/components/circuit/PlaybackControls"
import { useLocalSim } from "@/hooks/useLocalSim"
import { useUndoRedo } from "@/hooks/useUndoRedo"
import { useUrlCircuit } from "@/hooks/useUrlCircuit"
import { useCircuitStore } from "@/store/circuitStore"

export function WorkspaceCircuitBuilder({ canSync }: { canSync: boolean }) {
  const { nQubits, setNQubits, clearCircuit, undo, redo, undoStack, redoStack } = useCircuitStore()

  useLocalSim()
  useUndoRedo()
  useUrlCircuit()

  return (
    <div style={builderShellStyle}>
      <div style={builderHeaderStyle}>
        <div>
          <div style={builderEyebrowStyle}>CIRCUIT SURFACE</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Editable gate grid</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6 }}>
            Drag gates into the circuit or let the pseudocode populate the grid automatically.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{
              ...statusChipStyle,
              color: canSync ? "var(--accent-cyan)" : "var(--accent-amber)",
              borderColor: canSync ? "var(--accent-cyan)" : "var(--accent-amber)",
            }}
          >
            {canSync ? "sync live" : "sync paused"}
          </span>
          <span style={statusChipStyle}>24 slots</span>
        </div>
      </div>

      <div style={builderToolbarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={builderEyebrowStyle}>QUBITS</span>
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((count) => (
            <button
              key={count}
              onClick={() => setNQubits(count)}
              style={{
                width: 30,
                height: 24,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: count === nQubits ? 700 : 500,
                background: count === nQubits ? "var(--accent-cyan)" : "var(--bg-card)",
                color: count === nQubits ? "var(--button-primary-text)" : "var(--text-secondary)",
                border: `1px solid ${count === nQubits ? "var(--accent-cyan)" : "var(--border)"}`,
              }}
            >
              {count}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={undo} disabled={undoStack.length === 0} style={toolbarButtonStyle}>
            Undo
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} style={toolbarButtonStyle}>
            Redo
          </button>
          <button onClick={clearCircuit} style={toolbarButtonStyle}>
            Clear
          </button>
        </div>
      </div>

      <GatePanel />
      <div style={gridShellStyle}>
        <CircuitGrid />
      </div>
      <GatePanelBottom />
      <PlaybackControls />
      <MeasurementPanel />
    </div>
  )
}

const builderShellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  minHeight: 520,
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  overflow: "hidden",
  background: "linear-gradient(180deg, var(--bg-elevated), var(--bg-panel))",
}

const builderHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
  padding: "14px 16px 12px",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-panel)",
  flexWrap: "wrap",
}

const builderToolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  padding: "10px 16px",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-card)",
}

const builderEyebrowStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
}

const gridShellStyle: CSSProperties = {
  flex: 1,
  minHeight: 300,
  overflow: "auto",
  background: "linear-gradient(180deg, var(--bg-card), var(--bg-elevated))",
}

const statusChipStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-active)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

const toolbarButtonStyle: CSSProperties = {
  padding: "7px 12px",
  fontSize: 12,
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 999,
  background: "var(--bg-panel)",
}
