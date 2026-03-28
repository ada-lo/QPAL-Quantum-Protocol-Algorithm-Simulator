import { create } from "zustand"
import type { StepSnapshot } from "@/lib/quantum/simulator"
import type { WorkspaceSystemCapabilities, WorkspaceTemplate, WorkspaceSimulationResponse } from "@/lib/workspace/types"
import { languagePresets, PRESET_UNAVAILABLE } from "@/utils/languagePresets"
import { simulateWorkspaceProgram } from "@/lib/workspace/api"

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
  engine: 'custom' | 'openqasm' | 'qunetsim'
  simulationResponse: WorkspaceSimulationResponse | null

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

  // Dynamic Template Parameters
  activeTemplate: WorkspaceTemplate | null
  activeTemplateBaseCode: string | null
  templateParams: Record<string, any>

  setResult: (r: SimResult) => void
  setSnapshots: (s: StepSnapshot[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setStreamStep: (s: number) => void
  setEngineUsed: (e: string | null) => void
  setEngine: (e: 'custom' | 'openqasm' | 'qunetsim') => void
  runSimulation: (code: string) => Promise<void>
  setPreflightOpen: (v: boolean) => void
  setNoiseModel: (m: NoiseModel) => void
  setComputeTarget: (t: ComputeTarget) => void
  setSystemHardware: (h: WorkspaceSystemCapabilities | null) => void
  setWalkthroughOpen: (v: boolean) => void
  setWalkthroughStep: (s: number) => void
  setOpenForWalkthrough: (v: boolean) => void
  
  loadTemplate: (template: WorkspaceTemplate) => string
  updateParameter: (key: string, value: any) => string | null

  reset: () => void
}

export const useSimStore = create<SimState>((set, get) => ({
  result: null,
  snapshots: [],
  loading: false,
  error: null,
  streamStep: 0,
  engineUsed: null,
  engine: 'custom',
  simulationResponse: null,

  // Pre-flight execution config
  preflightOpen: false,
  noiseModel: 'ideal',
  computeTarget: 'cpu',
  systemHardware: null,

  // Step Walkthrough Debugger
  walkthroughOpen: false,
  walkthroughStep: 0,
  openForWalkthrough: false,

  // Dynamic Template Parameters
  activeTemplate: null,
  activeTemplateBaseCode: null,
  templateParams: {},

  setResult:             (r) => set({ result: r, loading: false, error: null }),
  setSnapshots:          (s) => set({ snapshots: s }),
  setLoading:            (v) => set({ loading: v }),
  setError:              (e) => set({ error: e, loading: false }),
  setStreamStep:         (s) => set({ streamStep: s }),
  setEngineUsed:         (e) => set({ engineUsed: e }),
  setEngine:             (e) => set({ engine: e }),

  runSimulation: async (code) => {
    const { engine, noiseModel, computeTarget } = get()
    set({ loading: true, error: null })
    try {
      const response = await simulateWorkspaceProgram(code, engine, {
        noiseModel: noiseModel === 'ideal' ? undefined : noiseModel,
        preferGpu: computeTarget === 'gpu',
      })
      set({ simulationResponse: response, loading: false, error: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Simulation failed.', loading: false })
    }
  },
  setPreflightOpen:      (v) => set({ preflightOpen: v }),
  setNoiseModel:         (m) => set({ noiseModel: m }),
  setComputeTarget:      (t) => set({ computeTarget: t }),
  setSystemHardware:     (h) => set({ systemHardware: h }),
  setWalkthroughOpen:    (v) => set({ walkthroughOpen: v }),
  setWalkthroughStep:    (s) => set({ walkthroughStep: s }),
  setOpenForWalkthrough: (v) => set({ openForWalkthrough: v }),

  loadTemplate: (template) => {
    const params: Record<string, any> = {}
    if (template.parameters) {
      template.parameters.forEach(p => { params[p.name] = p.default })
    }
    // Infer engine from template kind
    const engine: 'custom' | 'openqasm' | 'qunetsim' = template.kind === 'protocol' ? 'qunetsim' : 'custom'
    set({ activeTemplate: template, activeTemplateBaseCode: template.code, templateParams: params, engine })

    // Check for a language-specific preset first
    const preset = languagePresets[template.id]
    if (preset && engine !== 'custom') {
      const presetCode = preset[engine]
      return presetCode ?? PRESET_UNAVAILABLE(engine)
    }

    // If engine is openqasm but template only has custom pseudocode, inject a warning
    const currentEngine = get().engine
    if (currentEngine === 'openqasm' && !preset?.openqasm) {
      const warning = '// WARNING: This template is written in QPAL Custom Code.\n// Please switch the engine dropdown to \'QPAL Parser\' to run it,\n// or translate it to OpenQASM.\n\n'
      // Fall through to hydrate the template code, but prepend the warning
      let hydrated = template.code
      for (const [k, v] of Object.entries(params)) {
        hydrated = hydrated.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
      }
      if (params['hidden_string'] !== undefined) {
        const s = String(params['hidden_string'])
        const n = s.length
        const cnots = s.split('').map((bit, idx) => bit === '1' ? `CNOT q${idx} q${n}` : '').filter(Boolean).join('\n')
        hydrated = hydrated.replace(/\{\{oracle_gates\}\}/g, cnots || 'NOTE zero string')
      }
      return warning + hydrated
    }

    // Fallback: hydrate the raw pseudocode with template params
    let hydrated = template.code
    for (const [k, v] of Object.entries(params)) {
      hydrated = hydrated.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
    }
    if (params['hidden_string'] !== undefined) {
      const s = String(params['hidden_string'])
      const n = s.length
      const cnots = s.split('').map((bit, idx) => bit === '1' ? `CNOT q${idx} q${n}` : '').filter(Boolean).join('\n')
      hydrated = hydrated.replace(/\{\{oracle_gates\}\}/g, cnots || 'NOTE zero string')
    }
    return hydrated
  },

  updateParameter: (key, value) => {
    const { activeTemplateBaseCode, templateParams } = get()
    if (!activeTemplateBaseCode) return null

    const newParams = { ...templateParams, [key]: value }
    set({ templateParams: newParams })

    let hydrated = activeTemplateBaseCode
    for (const [k, v] of Object.entries(newParams)) {
      hydrated = hydrated.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
    }

    // Specially handle Oracle generation for Bernstein-Vazirani
    if (newParams['hidden_string'] !== undefined) {
      const s = String(newParams['hidden_string'])
      const n = s.length
      const cnots = s.split('').map((bit, idx) => bit === '1' ? `CNOT q${idx} q${n}` : '').filter(Boolean).join('\n')
      hydrated = hydrated.replace(/\{\{oracle_gates\}\}/g, cnots || 'NOTE zero string')
    }

    return hydrated
  },

  reset: () => set({ result: null, snapshots: [], loading: false, error: null, streamStep: 0 }),
}))
