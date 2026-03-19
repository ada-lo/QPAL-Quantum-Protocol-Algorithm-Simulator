
import { useEffect } from "react"
import { useCircuitStore } from "@/store/circuitStore"
import { useCircuit } from "@/hooks/useCircuit"
import { useLocalSim } from "@/hooks/useLocalSim"
import { GatePanel } from "./GatePanel"
import { CircuitGrid } from "./CircuitGrid"
import { MeasurementPanel } from "./MeasurementPanel"
import { PresetSelector } from "./PresetSelector"
import { PlaybackControls } from "./PlaybackControls"
import { StreamStatus } from "@/components/shared/StreamStatus"

export function CircuitBuilder() {
  const { nQubits, setNQubits, clearCircuit, runSimulation, loading, gates } = useCircuit()
  useLocalSim()  // auto-runs on every gate change for ≤6 qubits

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Top toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
        borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          QUBITS
        </span>
        {[1,2,3,4,5,6,8,10,12,16,20].map(n => (
          <button key={n} onClick={() => setNQubits(n)} style={{
            width: 32, height: 24, borderRadius: "var(--radius-sm)",
            fontSize: 12, fontWeight: n === nQubits ? 700 : 400,
            background: n === nQubits ? "var(--accent-cyan)" : "var(--bg-card)",
            color: n === nQubits ? "#000" : "var(--text-secondary)",
            border: `1px solid ${n === nQubits ? "var(--accent-cyan)" : "var(--border)"}`,
            transition: "all var(--transition)",
          }}>{n}</button>
        ))}
        {nQubits > 6 && (
          <span style={{
            fontSize: 10, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)",
            padding: "2px 6px", background: "rgba(0,212,255,0.08)",
            borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,212,255,0.2)",
          }}>⬡ QDD</span>
        )}
        <div style={{ flex: 1 }} />
        <PresetSelector />
        <button onClick={clearCircuit} title="Clear circuit" style={{
          padding: "4px 10px", fontSize: 12, color: "var(--text-secondary)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          background: "transparent",
        }}>⌫ Clear</button>
        <button onClick={runSimulation} disabled={loading || gates.length === 0} style={{
          padding: "4px 14px", fontSize: 12, fontWeight: 700,
          background: loading ? "var(--bg-hover)" : "var(--accent-cyan)",
          color: loading ? "var(--text-muted)" : "#000",
          borderRadius: "var(--radius-sm)", transition: "all var(--transition)",
          opacity: gates.length === 0 ? 0.4 : 1,
        }}>
          {loading ? "⟳ Running" : "▶ Run"}
        </button>
      </div>

      {/* ── Gate palette ── */}
      <GatePanel />

      {/* ── Circuit grid ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <CircuitGrid />
      </div>

      {/* ── Playback scrubber ── */}
      <PlaybackControls />

      {/* ── Measurement panel ── */}
      <MeasurementPanel />
    </div>
  )
}
