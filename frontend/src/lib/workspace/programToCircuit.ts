import { INITIAL_STATE_CYCLE, type InitialStateId } from "@/lib/quantum/simulator"
import type { CircuitGate } from "@/store/circuitStore"

import type { WorkspaceInstruction } from "./types"

export interface ProgramCircuitSnapshot {
  nQubits: number
  gates: Omit<CircuitGate, "id">[]
  initialStates: InitialStateId[]
}

function qubitIndex(qubit: string) {
  return Number.parseInt(qubit.replace(/^q/i, ""), 10)
}

function stateForToken(token: string): InitialStateId {
  if (token === "1") {
    return (INITIAL_STATE_CYCLE.find((state) => state.includes("1")) ?? INITIAL_STATE_CYCLE[0]) as InitialStateId
  }
  if (token === "+") {
    return (INITIAL_STATE_CYCLE.find((state) => state.includes("+")) ?? INITIAL_STATE_CYCLE[0]) as InitialStateId
  }
  if (token === "-") {
    return (INITIAL_STATE_CYCLE.find((state) => state.includes("-") || state.includes("−")) ?? INITIAL_STATE_CYCLE[0]) as InitialStateId
  }
  return (INITIAL_STATE_CYCLE.find((state) => state.includes("0")) ?? INITIAL_STATE_CYCLE[0]) as InitialStateId
}

export function programToCircuit(instructions: WorkspaceInstruction[]): ProgramCircuitSnapshot {
  const discoveredQubits = new Set<number>()
  instructions.forEach((instruction) => {
    instruction.qubits.forEach((qubit) => {
      discoveredQubits.add(qubitIndex(qubit))
    })
  })

  const maxIndex = discoveredQubits.size > 0 ? Math.max(...discoveredQubits) : 0
  const nQubits = Math.max(1, maxIndex + 1)
  const initialStates = Array.from({ length: nQubits }, () => stateForToken("0"))
  const gates: Omit<CircuitGate, "id">[] = []

  let step = 0
  let usedOperationalGate = false

  instructions.forEach((instruction) => {
    const opcode = instruction.opcode.toUpperCase()

    if (opcode === "INIT" && !usedOperationalGate) {
      const target = instruction.qubits[0]
      if (target) {
        initialStates[qubitIndex(target)] = stateForToken(String(instruction.metadata.state ?? "0"))
      }
      return
    }

    if (opcode === "RESET" && !usedOperationalGate) {
      const target = instruction.qubits[0]
      if (target) {
        initialStates[qubitIndex(target)] = stateForToken("0")
      }
      return
    }

    if (opcode === "H" || opcode === "X" || opcode === "Y" || opcode === "Z") {
      gates.push({ gateId: opcode, qubit: qubitIndex(instruction.qubits[0]), step })
      step += 1
      usedOperationalGate = true
      return
    }

    if (opcode === "S" || opcode === "T" || opcode === "SDG" || opcode === "TDG" || opcode === "SX") {
      const gateId = opcode === "SDG" ? "Sdg" : opcode === "TDG" ? "Tdg" : opcode
      gates.push({ gateId: gateId as "S" | "T" | "Sdg" | "Tdg" | "SX", qubit: qubitIndex(instruction.qubits[0]), step })
      step += 1
      usedOperationalGate = true
      return
    }

    if (opcode === "RX" || opcode === "RY" || opcode === "RZ") {
      const gateId = opcode === "RX" ? "Rx" : opcode === "RY" ? "Ry" : "Rz"
      gates.push({
        gateId,
        qubit: qubitIndex(instruction.qubits[0]),
        step,
        angle: Number(instruction.metadata.angle ?? Math.PI / 2),
      })
      step += 1
      usedOperationalGate = true
      return
    }

    if (opcode === "SWAP" || opcode === "CNOT" || opcode === "CZ") {
      gates.push({
        gateId: opcode as "SWAP" | "CNOT" | "CZ",
        qubit: qubitIndex(instruction.qubits[0]),
        targetQubit: qubitIndex(instruction.qubits[1]),
        step,
      })
      step += 1
      usedOperationalGate = true
      return
    }

    if (opcode === "TOFFOLI") {
      gates.push({
        gateId: "TOFFOLI",
        qubit: qubitIndex(instruction.qubits[0]),
        controlQubit: qubitIndex(instruction.qubits[1]),
        targetQubit: qubitIndex(instruction.qubits[2]),
        step,
      })
      step += 1
      usedOperationalGate = true
      return
    }

    if (opcode === "MEASURE") {
      const target = qubitIndex(instruction.qubits[0])
      if ((instruction.basis ?? "Z") === "X") {
        gates.push({ gateId: "H", qubit: target, step })
        gates.push({ gateId: "MEASURE", qubit: target, step: step + 1 })
        step += 2
      } else {
        gates.push({ gateId: "MEASURE", qubit: target, step })
        step += 1
      }
      usedOperationalGate = true
      return
    }

    if (opcode === "INIT" || opcode === "RESET") {
      const target = qubitIndex(instruction.qubits[0])
      const state = String(instruction.metadata.state ?? "0")
      if (opcode === "RESET" || state === "0") {
        step += 1
        return
      }
      if (state === "1" || state === "-") {
        gates.push({ gateId: "X", qubit: target, step })
        step += 1
      }
      if (state === "+" || state === "-") {
        gates.push({ gateId: "H", qubit: target, step })
        step += 1
      }
      usedOperationalGate = true
      return
    }

    if (["ACTOR", "ASSIGN", "SEND", "INTERCEPT", "LABEL", "NOTE", "WAIT", "BARRIER"].includes(opcode)) {
      step += 1
    }
  })

  return { nQubits, gates, initialStates }
}
