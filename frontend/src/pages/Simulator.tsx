import { useMemo } from "react"
import { BlochSphere } from "@/components/bloch/BlochSphere"
import { CircuitBuilder } from "@/components/circuit/CircuitBuilder"
import { CircuitPseudocodePanel } from "@/components/circuit/CircuitPseudocodePanel"
import { LearningStudioPanel } from "@/components/learning/LearningStudioPanel"
import { NoiseDashboard } from "@/components/noise/NoiseDashboard"
import { QDDGraphView } from "@/components/qdd/QDDGraphView"
import { TabPanel } from "@/components/shared/TabPanel"
import { formatBasisState } from "@/lib/quantum/stateVector"
import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore } from "@/store/simStore"

function OutputPanel() {
  const result = useSimStore((s) => s.result)
  const nQubits = useCircuitStore((s) => s.nQubits)

  const stateRows = useMemo(() => {
    if (!result?.stateVector) return []
    return result.stateVector
      .map((c: any, i: number) => ({
        basis: formatBasisState(i, nQubits),
        prob: c.re * c.re + c.im * c.im,
      }))
      .filter((row: any) => row.prob > 0.0001)
      .sort((a: any, b: any) => b.prob - a.prob)
      .slice(0, 24)
  }, [result, nQubits])

  if (!result) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100%",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
        }}
      >
        Load a lesson or place gates to inspect the state.
      </div>
    )
  }

  return (
    <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>STATE VECTOR SNAPSHOT</div>
      {stateRows.map((row: any) => (
        <div
          key={row.basis}
          style={{
            display: "grid",
            gridTemplateColumns: "58px 1fr 46px",
            gap: 10,
            alignItems: "center",
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>{row.basis}</span>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${row.prob * 100}%`, height: "100%", background: "var(--accent-cyan)" }} />
          </div>
          <span style={{ fontSize: 10, textAlign: "right", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {(row.prob * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export function Simulator() {
  const nQubits = useCircuitStore((s) => s.nQubits)

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.35fr) minmax(360px, 0.9fr)",
        height: "100%",
        gap: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          background: "rgba(251,248,241,0.46)",
        }}
      >
        <CircuitBuilder />
      </div>

      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "rgba(251,248,241,0.58)",
        }}
      >
        <TabPanel
          tabs={[
            { id: "studio", label: "Studio", content: <LearningStudioPanel /> },
            { id: "pseudocode", label: "Pseudocode", content: <CircuitPseudocodePanel /> },
            { id: "output", label: "Output", content: <OutputPanel /> },
            { id: "bloch", label: "Bloch", content: <BlochSphere /> },
            { id: "noise", label: "Noise", content: <NoiseDashboard /> },
            ...(nQubits > 6 ? [{ id: "qdd", label: "QDD", content: <QDDGraphView /> }] : []),
          ]}
        />
      </div>
    </div>
  )
}
