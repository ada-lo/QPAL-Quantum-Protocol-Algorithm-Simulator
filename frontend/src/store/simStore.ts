import { create } from "zustand"
import type { StepSnapshot } from "@/lib/quantum/simulator"
import type { WorkspaceSystemCapabilities } from "@/lib/workspace/types"

export type NoiseModel = 'ideal' | 'ibm_eagle' | 'ibm_osprey'
export type ComputeTarget = 'cpu' | 'gpu'

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

  // Pre-flight execution config
  preflightOpen: boolean
  noiseModel: NoiseModel
  computeTarget: ComputeTarget
  systemHardware: WorkspaceSystemCapabilities | null

  // Step Walkthrough Debugger
  walkthroughOpen: boolean
  walkthroughStep: number
  /** When true, PreFlightModal's Run fires executeProgram then immediately opens the walkthrough */
  openForWalkthrough: boolean

  setResult: (r: SimResult) => void
  setSnapshots: (s: StepSnapshot[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setStreamStep: (s: number) => void
  setEngineUsed: (e: string | null) => void
  setPreflightOpen: (v: boolean) => void
  setNoiseModel: (m: NoiseModel) => void
  setComputeTarget: (t: ComputeTarget) => void
  setSystemHardware: (h: WorkspaceSystemCapabilities | null) => void
  setWalkthroughOpen: (v: boolean) => void
  setWalkthroughStep: (s: number) => void
  setOpenForWalkthrough: (v: boolean) => void
  reset: () => void
}

export const useSimStore = create<SimState>((set) => ({
  result: null,
  snapshots: [],
  loading: false,
  error: null,
  streamStep: 0,
  engineUsed: null,

  // Pre-flight execution config
  preflightOpen: false,
  noiseModel: 'ideal',
  computeTarget: 'cpu',
  systemHardware: null,

  // Step Walkthrough Debugger
  walkthroughOpen: false,
  walkthroughStep: 0,
  openForWalkthrough: false,

  setResult:             (r) => set({ result: r, loading: false, error: null }),
  setSnapshots:          (s) => set({ snapshots: s }),
  setLoading:            (v) => set({ loading: v }),
  setError:              (e) => set({ error: e, loading: false }),
  setStreamStep:         (s) => set({ streamStep: s }),
  setEngineUsed:         (e) => set({ engineUsed: e }),
  setPreflightOpen:      (v) => set({ preflightOpen: v }),
  setNoiseModel:         (m) => set({ noiseModel: m }),
  setComputeTarget:      (t) => set({ computeTarget: t }),
  setSystemHardware:     (h) => set({ systemHardware: h }),
  setWalkthroughOpen:    (v) => set({ walkthroughOpen: v }),
  setWalkthroughStep:    (s) => set({ walkthroughStep: s }),
  setOpenForWalkthrough: (v) => set({ openForWalkthrough: v }),
  reset: () => set({ result: null, snapshots: [], loading: false, error: null, streamStep: 0 }),
}))
