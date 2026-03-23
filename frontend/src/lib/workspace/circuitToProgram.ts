import type { InitialStateId } from "@/lib/quantum/simulator"
import type { CircuitGate } from "@/store/circuitStore"

export interface CircuitProgramSnapshot {
  nQubits: number
  gates: CircuitGate[]
  initialStates: InitialStateId[]
}

function initialStateToken(state: InitialStateId | undefined) {
  if (!state) return "0"
  if (state.includes("1")) return "1"
  if (state.includes("+")) return "+"
  if (state.includes("-") || state.includes("−")) return "-"
  return "0"
}

function gateToInstruction(gate: CircuitGate) {
  switch (gate.gateId) {
    case "H":
    case "X":
    case "Y":
    case "Z":
    case "S":
    case "T":
      return `${gate.gateId} q${gate.qubit}`
    case "Sdg":
      return `SDG q${gate.qubit}`
    case "Tdg":
      return `TDG q${gate.qubit}`
    case "SX":
      return `SX q${gate.qubit}`
    case "Rx":
      return `RX q${gate.qubit} ${gate.angle ?? Math.PI / 2}`
    case "Ry":
      return `RY q${gate.qubit} ${gate.angle ?? Math.PI / 2}`
    case "Rz":
      return `RZ q${gate.qubit} ${gate.angle ?? Math.PI / 2}`
    case "MEASURE":
      return `MEASURE q${gate.qubit} BASIS Z`
    case "CNOT":
    case "SWAP":
    case "CZ":
      if (gate.targetQubit === undefined) return null
      return `${gate.gateId} q${gate.qubit} q${gate.targetQubit}`
    case "TOFFOLI":
      if (gate.controlQubit === undefined || gate.targetQubit === undefined) return null
      return `TOFFOLI q${gate.qubit} q${gate.controlQubit} q${gate.targetQubit}`
    case "CHANCE":
    case "AMPS":
    case "BLOCH":
    case "DENSITY":
      return `NOTE Display ${gate.gateId} on q${gate.qubit}`
    default:
      return `NOTE Unsupported gate ${gate.gateId} on q${gate.qubit}`
  }
}

export function circuitSnapshotToProgram(snapshot: CircuitProgramSnapshot) {
  const lines: string[] = ["LABEL Circuit Workspace"]

  for (let qubit = 0; qubit < snapshot.nQubits; qubit += 1) {
    lines.push(`INIT q${qubit} ${initialStateToken(snapshot.initialStates[qubit])}`)
  }

  const grouped = new Map<number, CircuitGate[]>()
  snapshot.gates.forEach((gate) => {
    const gates = grouped.get(gate.step) ?? []
    gates.push(gate)
    grouped.set(gate.step, gates)
  })

  const steps = Array.from(grouped.keys()).sort((left, right) => left - right)
  steps.forEach((step, index) => {
    const gates = (grouped.get(step) ?? []).slice().sort((left, right) => left.qubit - right.qubit)
    if (index > 0) {
      lines.push("BARRIER")
    }
    gates.forEach((gate) => {
      const instruction = gateToInstruction(gate)
      if (instruction) {
        lines.push(instruction)
      }
    })
  })

  return lines.join("\n")
}
