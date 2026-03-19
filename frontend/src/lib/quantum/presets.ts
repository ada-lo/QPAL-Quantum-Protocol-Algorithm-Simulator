import type { CircuitGate } from "@/store/circuitStore"

export interface CircuitPreset {
  id: string
  label: string
  description: string
  nQubits: number
  gates: Omit<CircuitGate, "id">[]
}

export const PRESETS: CircuitPreset[] = [
  {
    id: "bell",
    label: "Bell State",
    description: "|Φ+⟩ = (|00⟩ + |11⟩)/√2",
    nQubits: 2,
    gates: [
      { gateId: "H",    qubit: 0, step: 0 },
      { gateId: "CNOT", qubit: 0, step: 1, targetQubit: 1 },
    ],
  },
  {
    id: "ghz",
    label: "GHZ State",
    description: "(|000⟩ + |111⟩)/√2",
    nQubits: 3,
    gates: [
      { gateId: "H",    qubit: 0, step: 0 },
      { gateId: "CNOT", qubit: 0, step: 1, targetQubit: 1 },
      { gateId: "CNOT", qubit: 0, step: 2, targetQubit: 2 },
    ],
  },
  {
    id: "qft3",
    label: "QFT (3 qubits)",
    description: "Quantum Fourier Transform",
    nQubits: 3,
    gates: [
      { gateId: "H", qubit: 0, step: 0 },
      { gateId: "S", qubit: 0, step: 1 },
      { gateId: "T", qubit: 0, step: 2 },
      { gateId: "H", qubit: 1, step: 3 },
      { gateId: "S", qubit: 1, step: 4 },
      { gateId: "H", qubit: 2, step: 5 },
      { gateId: "SWAP", qubit: 0, step: 6, targetQubit: 2 },
    ],
  },
  {
    id: "superpos",
    label: "Full Superposition",
    description: "H on all qubits → equal superposition",
    nQubits: 3,
    gates: [
      { gateId: "H", qubit: 0, step: 0 },
      { gateId: "H", qubit: 1, step: 0 },
      { gateId: "H", qubit: 2, step: 0 },
    ],
  },
  {
    id: "teleport",
    label: "Teleportation",
    description: "Quantum teleportation circuit",
    nQubits: 3,
    gates: [
      { gateId: "H",    qubit: 1, step: 0 },
      { gateId: "CNOT", qubit: 1, step: 1, targetQubit: 2 },
      { gateId: "CNOT", qubit: 0, step: 2, targetQubit: 1 },
      { gateId: "H",    qubit: 0, step: 3 },
    ],
  },
]
