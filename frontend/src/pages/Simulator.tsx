
import { CircuitBuilder } from "@/components/circuit/CircuitBuilder"
import { BlochSphere } from "@/components/bloch/BlochSphere"
import { NoiseDashboard } from "@/components/noise/NoiseDashboard"
import { QDDGraphView } from "@/components/qdd/QDDGraphView"
import { TabPanel } from "@/components/shared/TabPanel"
import { useCircuitStore } from "@/store/circuitStore"

export function Simulator() {
  const nQubits = useCircuitStore(s => s.nQubits)
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left — circuit builder, flexible width */}
      <div style={{ flex: "1 1 0", minWidth: 0, borderRight: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <CircuitBuilder />
      </div>
      {/* Right — visualization panel, fixed width */}
      <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TabPanel tabs={[
          { id: "bloch",  label: "Bloch",  content: <BlochSphere /> },
          { id: "noise",  label: "Noise",  content: <NoiseDashboard /> },
          ...(nQubits > 6 ? [{ id: "qdd", label: "QDD ⬡", content: <QDDGraphView /> }] : []),
        ]} />
      </div>
    </div>
  )
}
