import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Circuit, Gate, SimulationResult, NoisySimulationResult,
  NoiseModel, QDDGraph, ProtocolResult, AlgorithmResult,
  SimulationStep
} from '@/lib/types'
import { DEFAULT_NOISE_MODEL_IDEAL } from '@/lib/constants'

// ── Circuit slice ─────────────────────────────────────────────────
interface CircuitSlice {
  circuit: Circuit
  selectedGateId: string | null
  setCircuit: (c: Circuit) => void
  addGate: (gate: Gate) => void
  removeGate: (id: string) => void
  updateGate: (id: string, patch: Partial<Gate>) => void
  setNumQubits: (n: number) => void
  clearCircuit: () => void
  selectGate: (id: string | null) => void
}

// ── Simulation slice ──────────────────────────────────────────────
interface SimulationSlice {
  isRunning: boolean
  currentStep: number
  result: SimulationResult | NoisySimulationResult | null
  steps: SimulationStep[]
  playbackSpeed: number
  isPlaying: boolean
  setRunning: (v: boolean) => void
  setResult: (r: SimulationResult | NoisySimulationResult | null) => void
  setCurrentStep: (s: number) => void
  stepForward: () => void
  stepBackward: () => void
  setPlaying: (v: boolean) => void
  setPlaybackSpeed: (s: number) => void
  reset: () => void
}

// ── Noise slice ───────────────────────────────────────────────────
interface NoiseSlice {
  noiseModel: NoiseModel
  noiseEnabled: boolean
  setNoiseModel: (m: NoiseModel) => void
  setNoiseEnabled: (v: boolean) => void
}

// ── QDD slice ─────────────────────────────────────────────────────
interface QDDSlice {
  qddGraph: QDDGraph | null
  setQDDGraph: (g: QDDGraph | null) => void
}

// ── Protocol slice ────────────────────────────────────────────────
interface ProtocolSlice {
  protocolResult: ProtocolResult | null
  protocolStep: number
  eveEnabled: boolean
  setProtocolResult: (r: ProtocolResult | null) => void
  setProtocolStep: (s: number) => void
  setEveEnabled: (v: boolean) => void
}

// ── Algorithm slice ───────────────────────────────────────────────
interface AlgorithmSlice {
  algorithmResult: AlgorithmResult | null
  algorithmStep: number
  setAlgorithmResult: (r: AlgorithmResult | null) => void
  setAlgorithmStep: (s: number) => void
}

// ── Backend status ────────────────────────────────────────────────
interface StatusSlice {
  backendOnline: boolean
  gpuAvailable: boolean
  setBackendOnline: (v: boolean) => void
  setGpuAvailable: (v: boolean) => void
}

// ── Combined store ────────────────────────────────────────────────
type Store = CircuitSlice & SimulationSlice & NoiseSlice &
             QDDSlice & ProtocolSlice & AlgorithmSlice & StatusSlice

const makeDefaultCircuit = (): Circuit => ({
  id: 'default',
  name: 'Untitled Circuit',
  numQubits: 3,
  gates: [],
  shots: 1024,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const useStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    // ── Circuit ──
    circuit: makeDefaultCircuit(),
    selectedGateId: null,
    setCircuit: (circuit) => set({ circuit }),
    addGate: (gate) => set((s) => ({
      circuit: { ...s.circuit, gates: [...s.circuit.gates, gate], updatedAt: new Date().toISOString() }
    })),
    removeGate: (id) => set((s) => ({
      circuit: { ...s.circuit, gates: s.circuit.gates.filter(g => g.id !== id) }
    })),
    updateGate: (id, patch) => set((s) => ({
      circuit: { ...s.circuit, gates: s.circuit.gates.map(g => g.id === id ? { ...g, ...patch } : g) }
    })),
    setNumQubits: (numQubits) => set((s) => ({
      circuit: { ...s.circuit, numQubits, gates: s.circuit.gates.filter(g => g.qubit < numQubits) }
    })),
    clearCircuit: () => set((s) => ({
      circuit: { ...s.circuit, gates: [], updatedAt: new Date().toISOString() }
    })),
    selectGate: (selectedGateId) => set({ selectedGateId }),

    // ── Simulation ──
    isRunning: false,
    currentStep: 0,
    result: null,
    steps: [],
    playbackSpeed: 1,
    isPlaying: false,
    setRunning: (isRunning) => set({ isRunning }),
    setResult: (result) => set({
      result,
      steps: result?.steps ?? [],
      currentStep: 0,
    }),
    setCurrentStep: (currentStep) => set({ currentStep }),
    stepForward: () => set((s) => ({
      currentStep: Math.min(s.currentStep + 1, s.steps.length - 1)
    })),
    stepBackward: () => set((s) => ({
      currentStep: Math.max(s.currentStep - 1, 0)
    })),
    setPlaying: (isPlaying) => set({ isPlaying }),
    setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
    reset: () => set({ result: null, steps: [], currentStep: 0, isPlaying: false }),

    // ── Noise ──
    noiseModel: DEFAULT_NOISE_MODEL_IDEAL,
    noiseEnabled: false,
    setNoiseModel: (noiseModel) => set({ noiseModel }),
    setNoiseEnabled: (noiseEnabled) => set({ noiseEnabled }),

    // ── QDD ──
    qddGraph: null,
    setQDDGraph: (qddGraph) => set({ qddGraph }),

    // ── Protocol ──
    protocolResult: null,
    protocolStep: 0,
    eveEnabled: false,
    setProtocolResult: (protocolResult) => set({ protocolResult, protocolStep: 0 }),
    setProtocolStep: (protocolStep) => set({ protocolStep }),
    setEveEnabled: (eveEnabled) => set({ eveEnabled }),

    // ── Algorithm ──
    algorithmResult: null,
    algorithmStep: 0,
    setAlgorithmResult: (algorithmResult) => set({ algorithmResult, algorithmStep: 0 }),
    setAlgorithmStep: (algorithmStep) => set({ algorithmStep }),

    // ── Status ──
    backendOnline: false,
    gpuAvailable: false,
    setBackendOnline: (backendOnline) => set({ backendOnline }),
    setGpuAvailable: (gpuAvailable) => set({ gpuAvailable }),
  }))
)
