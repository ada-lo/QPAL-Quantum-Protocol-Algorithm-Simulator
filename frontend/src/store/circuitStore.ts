import { create } from "zustand"
import type { GateId } from "@/lib/quantum/gates"
import type { InitialStateId } from "@/lib/quantum/simulator"

// ── Circuit gate representation ──
export interface CircuitGate {
  id: string
  gateId: GateId
  qubit: number
  step: number
  targetQubit?: number
  controlQubit?: number
  angle?: number  // for rotation gates (Rx, Ry, Rz)
}

export interface PendingConnection {
  gateId: GateId
  qubits: number[]
  step: number
}

// ── Drag state ──
export interface DragState {
  gateId: GateId
  source: 'toolbox' | 'circuit'
  sourceGateId?: string   // if dragging from circuit, the gate's id
  angle?: number
}

// ── Undo/Redo history ──
interface HistoryEntry {
  gates: CircuitGate[]
  nQubits: number
  initialStates: InitialStateId[]
}

const MAX_HISTORY = 50

export interface CircuitState {
  nQubits: number
  gates: CircuitGate[]
  selectedGate: GateId | null
  currentStep: number
  isPlaying: boolean
  pendingConnection: PendingConnection | null
  hoveredCell: { qubit: number; step: number } | null

  // Drag-and-drop
  dragState: DragState | null
  setDragState: (d: DragState | null) => void

  // Initial states per qubit
  initialStates: InitialStateId[]
  setInitialState: (qubit: number, state: InitialStateId) => void
  cycleInitialState: (qubit: number) => void

  // Undo/Redo
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // Core actions
  setNQubits: (n: number) => void
  addGate: (gate: Omit<CircuitGate, "id">) => void
  removeGate: (id: string) => void
  moveGate: (id: string, newQubit: number, newStep: number) => void
  updateGateAngle: (id: string, angle: number) => void
  setSelectedGate: (gate: GateId | null) => void
  setCurrentStep: (step: number) => void
  setIsPlaying: (v: boolean) => void
  setPendingConnection: (p: PendingConnection | null) => void
  setHoveredCell: (c: { qubit: number; step: number } | null) => void
  clearCircuit: () => void
  loadPreset: (gates: Omit<CircuitGate, "id">[], nQubits: number, initialStates?: InitialStateId[]) => void
  replaceCircuit: (gates: Omit<CircuitGate, "id">[], nQubits: number, initialStates?: InitialStateId[]) => void
  maxStep: () => number

  // URL sync
  toJSON: () => string
  fromJSON: (json: string) => void
}

function makeInitialStates(n: number): InitialStateId[] {
  return Array.from({ length: n }, () => '|0⟩' as InitialStateId)
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  nQubits: 3,
  gates: [],
  selectedGate: null,
  currentStep: 0,
  isPlaying: false,
  pendingConnection: null,
  hoveredCell: null,
  dragState: null,
  initialStates: makeInitialStates(3),
  undoStack: [],
  redoStack: [],

  // ── Drag ──
  setDragState: (d) => set({ dragState: d }),

  // ── Initial states ──
  setInitialState: (qubit, state) => set(s => {
    const init = [...s.initialStates]
    while (init.length <= qubit) init.push('|0⟩')
    init[qubit] = state
    return { initialStates: init }
  }),

  cycleInitialState: (qubit) => set(s => {
    const CYCLE: InitialStateId[] = ['|0⟩', '|1⟩', '|+⟩', '|−⟩', '|i⟩', '|−i⟩']
    const init = [...s.initialStates]
    while (init.length <= qubit) init.push('|0⟩')
    const cur = init[qubit]
    const idx = CYCLE.indexOf(cur)
    init[qubit] = CYCLE[(idx + 1) % CYCLE.length]
    return { initialStates: init }
  }),

  // ── Undo/Redo ──
  pushHistory: () => set(s => ({
    undoStack: [
      ...s.undoStack.slice(-(MAX_HISTORY - 1)),
      { gates: s.gates.map(g => ({ ...g })), nQubits: s.nQubits, initialStates: [...s.initialStates] },
    ],
    redoStack: [],
  })),

  undo: () => set(s => {
    if (s.undoStack.length === 0) return s
    const prev = s.undoStack[s.undoStack.length - 1]
    return {
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [
        ...s.redoStack,
        { gates: s.gates.map(g => ({ ...g })), nQubits: s.nQubits, initialStates: [...s.initialStates] },
      ],
      gates: prev.gates,
      nQubits: prev.nQubits,
      initialStates: prev.initialStates,
    }
  }),

  redo: () => set(s => {
    if (s.redoStack.length === 0) return s
    const next = s.redoStack[s.redoStack.length - 1]
    return {
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [
        ...s.undoStack,
        { gates: s.gates.map(g => ({ ...g })), nQubits: s.nQubits, initialStates: [...s.initialStates] },
      ],
      gates: next.gates,
      nQubits: next.nQubits,
      initialStates: next.initialStates,
    }
  }),

  // ── Core ──
  setNQubits: (n) => {
    get().pushHistory()
    set(s => ({
      nQubits: n,
      gates: s.gates.filter(
        (g) =>
          g.qubit < n &&
          (g.targetQubit === undefined || g.targetQubit < n) &&
          (g.controlQubit === undefined || g.controlQubit < n),
      ),
      pendingConnection: null,
      initialStates: makeInitialStates(n),
    }))
  },

  addGate: (gate) => {
    get().pushHistory()
    set(s => ({
      gates: [...s.gates, { ...gate, id: crypto.randomUUID() }],
      pendingConnection: null,
    }))
  },

  removeGate: (id) => {
    get().pushHistory()
    set(s => ({ gates: s.gates.filter(g => g.id !== id) }))
  },

  moveGate: (id, newQubit, newStep) => {
    get().pushHistory()
    set(s => ({
      gates: s.gates.map((g) => {
        if (g.id !== id) return g

        const delta = newQubit - g.qubit
        const nextGate = {
          ...g,
          qubit: newQubit,
          step: newStep,
          targetQubit: g.targetQubit !== undefined ? g.targetQubit + delta : undefined,
          controlQubit: g.controlQubit !== undefined ? g.controlQubit + delta : undefined,
        }
        const occupied = [nextGate.qubit, nextGate.targetQubit, nextGate.controlQubit].filter(
          (value): value is number => value !== undefined,
        )

        return occupied.every((value) => value >= 0 && value < s.nQubits) ? nextGate : g
      }),
    }))
  },

  updateGateAngle: (id, angle) => set(s => ({
    gates: s.gates.map(g => g.id === id ? { ...g, angle } : g),
  })),

  setSelectedGate: (gate) => set({ selectedGate: gate, pendingConnection: null }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setPendingConnection: (p) => set({ pendingConnection: p }),
  setHoveredCell: (c) => set({ hoveredCell: c }),

  clearCircuit: () => {
    get().pushHistory()
    set({ gates: [], currentStep: 0, isPlaying: false, pendingConnection: null })
  },

  loadPreset: (gates, nQubits, initialStates) => {
    get().pushHistory()
    set({
      nQubits, currentStep: 0, isPlaying: false, pendingConnection: null,
      gates: gates.map(g => ({ ...g, id: crypto.randomUUID() })),
      initialStates: initialStates ? [...initialStates] : makeInitialStates(nQubits),
    })
  },

  replaceCircuit: (gates, nQubits, initialStates) => {
    set({
      nQubits,
      currentStep: 0,
      isPlaying: false,
      pendingConnection: null,
      gates: gates.map(g => ({ ...g, id: crypto.randomUUID() })),
      initialStates: initialStates ? [...initialStates] : makeInitialStates(nQubits),
    })
  },

  maxStep: () => {
    const gates = get().gates
    return gates.length === 0 ? 0 : Math.max(...gates.map(g => g.step))
  },

  // ── URL serialization ──
  toJSON: () => {
    const { nQubits, gates, initialStates } = get()
    const init = initialStates.some(s => s !== '|0⟩') ? initialStates : undefined
    return JSON.stringify({
      nQubits,
      gates: gates.map(({ id, ...gate }) => gate),
      init,
    })
  },

  fromJSON: (json) => {
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed?.gates)) {
        const nQubits = Number(parsed.nQubits) || 1
        set({
          nQubits,
          gates: parsed.gates.map((gate: Omit<CircuitGate, "id">) => ({ ...gate, id: crypto.randomUUID() })),
          initialStates: parsed.init ?? makeInitialStates(nQubits),
          currentStep: 0,
          isPlaying: false,
          pendingConnection: null,
        })
        return
      }

      const { cols, init } = parsed
      const nQubits = Math.max(...cols.map((c: any[]) => c.length))
      const gates: CircuitGate[] = []
      for (let s = 0; s < cols.length; s++) {
        const col = cols[s]
        for (let q = 0; q < col.length; q++) {
          const v = col[q]
          if (v === 1 || v === '1') continue
          const gateStr = typeof v === 'string' ? v : String(v)
          const angleMatch = gateStr.match(/^(\w+)\(([\d.]+)\)$/)
          if (angleMatch) {
            gates.push({
              id: crypto.randomUUID(),
              gateId: angleMatch[1] as GateId,
              qubit: q,
              step: s,
              angle: parseFloat(angleMatch[2]),
            })
          } else {
            gates.push({
              id: crypto.randomUUID(),
              gateId: gateStr as GateId,
              qubit: q,
              step: s,
            })
          }
        }
      }
      set({
        nQubits,
        gates,
        initialStates: init ?? makeInitialStates(nQubits),
        currentStep: 0,
        isPlaying: false,
        pendingConnection: null,
      })
    } catch {
      // Invalid JSON, ignore
    }
  },
}))
