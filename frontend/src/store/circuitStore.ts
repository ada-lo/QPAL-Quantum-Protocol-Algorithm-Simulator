import { create } from "zustand"
import type { GateId } from "@/lib/quantum/gates"

export interface CircuitGate {
  id: string
  gateId: GateId
  qubit: number
  step: number
  targetQubit?: number
  controlQubit?: number
}

export interface PendingConnection {
  gateId: GateId
  controlQubit: number
  step: number
}

export interface CircuitState {
  nQubits: number
  gates: CircuitGate[]
  selectedGate: GateId | null
  currentStep: number
  isPlaying: boolean
  pendingConnection: PendingConnection | null
  hoveredCell: { qubit: number; step: number } | null

  setNQubits: (n: number) => void
  addGate: (gate: Omit<CircuitGate, "id">) => void
  removeGate: (id: string) => void
  setSelectedGate: (gate: GateId | null) => void
  setCurrentStep: (step: number) => void
  setIsPlaying: (v: boolean) => void
  setPendingConnection: (p: PendingConnection | null) => void
  setHoveredCell: (c: { qubit: number; step: number } | null) => void
  clearCircuit: () => void
  loadPreset: (gates: Omit<CircuitGate, "id">[], nQubits: number) => void
  maxStep: () => number
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  nQubits: 3,
  gates: [],
  selectedGate: null,
  currentStep: 0,
  isPlaying: false,
  pendingConnection: null,
  hoveredCell: null,

  setNQubits: (n) => set({ nQubits: n, gates: [], pendingConnection: null }),
  addGate: (gate) => set((s) => ({
    gates: [...s.gates, { ...gate, id: crypto.randomUUID() }],
    pendingConnection: null,
  })),
  removeGate: (id) => set((s) => ({ gates: s.gates.filter(g => g.id !== id) })),
  setSelectedGate: (gate) => set({ selectedGate: gate, pendingConnection: null }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setPendingConnection: (p) => set({ pendingConnection: p }),
  setHoveredCell: (c) => set({ hoveredCell: c }),
  clearCircuit: () => set({ gates: [], currentStep: 0, isPlaying: false, pendingConnection: null }),
  loadPreset: (gates, nQubits) => set({
    nQubits, currentStep: 0, isPlaying: false, pendingConnection: null,
    gates: gates.map(g => ({ ...g, id: crypto.randomUUID() })),
  }),
  maxStep: () => {
    const gates = get().gates
    return gates.length === 0 ? 0 : Math.max(...gates.map(g => g.step))
  },
}))
