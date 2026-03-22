import { CircuitBuilder } from "@/components/circuit/CircuitBuilder"
import { BlochSphere } from "@/components/bloch/BlochSphere"
import { NoiseDashboard } from "@/components/noise/NoiseDashboard"
import { QDDGraphView } from "@/components/qdd/QDDGraphView"
import { LearningStudioPanel } from "@/components/learning/LearningStudioPanel"
import { TabPanel } from "@/components/shared/TabPanel"
import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore } from "@/store/simStore"
import { formatBasisState } from "@/lib/quantum/stateVector"
import { useMemo } from "react"

function OutputPanel() {
  const result = useSimStore(s => s.result)
  const nQubits = useCircuitStore(s => s.nQubits)

  const stateRows = useMemo(() => {
    if (!result?.stateVector) return []
    return result.stateVector
      .map((c: any, i: number) => ({
        basis: formatBasisState(i, nQubits),
        re: c.re, im: c.im,
        prob: c.re * c.re + c.im * c.im,
        phase: Math.atan2(c.im, c.re),
      }))
      .filter((r: any) => r.prob > 0.0001)
      .sort((a: any, b: any) => b.prob - a.prob)
      .slice(0, 32)
  }, [result, nQubits])

  if (!result) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", color: "var(--text-muted)", fontFamily: "var(--font-mono)",
      fontSize: 11,
    }}>
      Place gates to see output
    </div>
  )

  return (
    <div style={{ padding: "10px 12px", overflow: "auto", height: "100%" }}>
      <div style={{
        fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
        marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        State Vector ({stateRows.length} non-zero)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {stateRows.map((r: any) => (
          <div key={r.basis} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 8px", borderRadius: 4,
            background: r.prob > 0.5 ? "rgba(0,212,255,0.05)" : "transparent",
          }}>
            <span style={{
              fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600,
              color: "var(--accent-cyan)", minWidth: 52,
            }}>{r.basis}</span>
            <div style={{
              flex: 1, height: 8, background: "var(--bg-hover)", borderRadius: 2,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${r.prob * 100}%`, height: "100%",
                background: r.prob > 0.5 ? "var(--accent-cyan)" : "var(--accent-blue)",
                borderRadius: 2, transition: "width 0.3s ease",
              }} />
            </div>
            <span style={{
              fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-secondary)",
              minWidth: 40, textAlign: "right",
            }}>{(r.prob * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Simulator() {
  const nQubits = useCircuitStore(s => s.nQubits)
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left — circuit builder, flexible width */}
      <div style={{
        flex: "1 1 0", minWidth: 0,
        borderRight: "1px solid var(--border)",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <CircuitBuilder />
      </div>
      {/* Right — visualization panel */}
      <div style={{
        width: 320, flexShrink: 0,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <TabPanel tabs={[
          { id: "output", label: "Output", content: <OutputPanel /> },
          { id: "studio", label: "Studio 3D", content: <LearningStudioPanel /> },
          { id: "bloch",  label: "Bloch",  content: <BlochSphere /> },
          { id: "noise",  label: "Noise",  content: <NoiseDashboard /> },
          ...(nQubits > 6 ? [{ id: "qdd", label: "QDD ⬡", content: <QDDGraphView /> }] : []),
        ]} />
      </div>
    </div>
  )
}
