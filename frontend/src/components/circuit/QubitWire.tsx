import { useCircuitStore } from "@/store/circuitStore"
import { GateCell } from "./GateCell"

interface Props { qubitIndex: number; maxSteps: number }

export function QubitWire({ qubitIndex, maxSteps }: Props) {
  const { gates, selectedGate, addGate, nQubits } = useCircuitStore()

  const handleCellClick = (step: number) => {
    if (!selectedGate) return
    // Check if step is already occupied
    const occupied = gates.some(g => g.qubit === qubitIndex && g.step === step)
    if (occupied) return
    addGate({ gateId: selectedGate, qubit: qubitIndex, step })
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, height: 40 }}>
      {/* Qubit label */}
      <div style={{
        width: 32, flexShrink: 0, fontSize: 11, fontFamily: "var(--font-mono)",
        color: "var(--text-muted)", textAlign: "right", paddingRight: 8,
      }}>
        q{qubitIndex}
      </div>
      {/* Wire + gate cells */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
        {/* Horizontal wire line */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 1,
          background: "var(--border-bright)", top: "50%",
        }} />
        {Array.from({ length: maxSteps }, (_, step) => {
          const gate = gates.find(g => g.qubit === qubitIndex && g.step === step)
          return (
            <GateCell key={step} gate={gate} step={step} qubit={qubitIndex}
              onClick={() => handleCellClick(step)} />
          )
        })}
      </div>
    </div>
  )
}
