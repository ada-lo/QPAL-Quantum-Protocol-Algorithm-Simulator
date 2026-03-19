import { useCircuitStore, type CircuitGate } from "@/store/circuitStore"
import { GATES } from "@/lib/quantum/gates"

interface Props {
  gate?: CircuitGate
  step: number
  qubit: number
  onClick: () => void
}

export function GateCell({ gate, onClick }: Props) {
  const { removeGate, selectedGate } = useCircuitStore()
  const hasGate = !!gate

  if (hasGate && gate) {
    const def = GATES[gate.gateId]
    return (
      <div onClick={() => removeGate(gate.id)} title={`Remove ${def.label}`}
        style={{
          width: 32, height: 28, borderRadius: "var(--radius-sm)",
          background: def.color, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 10, fontWeight: 700,
          fontFamily: "var(--font-mono)", color: "#fff", cursor: "pointer",
          margin: "0 2px", flexShrink: 0, zIndex: 1, position: "relative",
          boxShadow: `0 0 8px ${def.color}44`,
        }}>
        {def.label}
      </div>
    )
  }

  return (
    <div onClick={onClick} style={{
      width: 32, height: 28, borderRadius: "var(--radius-sm)",
      margin: "0 2px", flexShrink: 0, cursor: selectedGate ? "pointer" : "default",
      zIndex: 1, position: "relative",
      background: "transparent",
      border: selectedGate ? "1px dashed var(--border-bright)" : "none",
      transition: "background var(--transition)",
    }}
    onMouseEnter={e => { if (selectedGate) e.currentTarget.style.background = "var(--bg-hover)" }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
    />
  )
}
