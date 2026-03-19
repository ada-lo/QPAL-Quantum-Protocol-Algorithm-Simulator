import { create } from "zustand"
import type { StepSnapshot } from "@/lib/quantum/simulator"

export interface Complex { re: number; im: number }
export interface BlochVec { x: number; y: number; z: number }

export interface SimResult {
  stateVector: Complex[]
  probabilities: number[]
  fidelity: number
  nQubits: number
  shots: number
  counts?: Record<string, number>
  blochVectors?: BlochVec[]
  qddGraph?: unknown
}

export interface SimState {
  result: SimResult | null
  snapshots: StepSnapshot[]
  loading: boolean
  error: string | null
  streamStep: number
  engineUsed: string | null

  setResult: (r: SimResult) => void
  setSnapshots: (s: StepSnapshot[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setStreamStep: (s: number) => void
  setEngineUsed: (e: string | null) => void
  reset: () => void
}

export const useSimStore = create<SimState>((set) => ({
  result: null,
  snapshots: [],
  loading: false,
  error: null,
  streamStep: 0,
  engineUsed: null,

  setResult:     (r) => set({ result: r, loading: false, error: null }),
  setSnapshots:  (s) => set({ snapshots: s }),
  setLoading:    (v) => set({ loading: v }),
  setError:      (e) => set({ error: e, loading: false }),
  setStreamStep: (s) => set({ streamStep: s }),
  setEngineUsed: (e) => set({ engineUsed: e }),
  reset: () => set({ result: null, snapshots: [], loading: false, error: null, streamStep: 0 }),
}))
