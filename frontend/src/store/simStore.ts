import { create } from "zustand"
import type { StepSnapshot } from "@/lib/quantum/simulator"
import type { WorkspaceSystemCapabilities, WorkspaceTemplate, WorkspaceSimulationResponse } from "@/lib/workspace/types"
import { languagePresets, PRESET_UNAVAILABLE } from "@/utils/languagePresets"
import { simulateWorkspaceProgram } from "@/lib/workspace/api"
import { getAuthToken } from "@/lib/auth/authClient"

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
  activeTemplateCategory: 'algorithm' | 'protocol' | null

  setResult: (r: SimResult) => void
  setSnapshots: (s: StepSnapshot[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setStreamStep: (s: number) => void
  setEngineUsed: (e: string | null) => void
  setEngine: (e: 'custom' | 'openqasm' | 'qunetsim') => Promise<void>
  runSimulation: (code: string) => Promise<void>
  setPreflightOpen: (v: boolean) => void
  setNoiseModel: (m: NoiseModel) => void
  setComputeTarget: (t: ComputeTarget) => void
  setSystemHardware: (h: WorkspaceSystemCapabilities | null) => void
  setWalkthroughOpen: (v: boolean) => void
  setWalkthroughStep: (s: number) => void
  setOpenForWalkthrough: (v: boolean) => void

  loadTemplate: (template: WorkspaceTemplate) => Promise<string>
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
  activeTemplateCategory: null,

  setResult: (r) => set({ result: r, loading: false, error: null }),
  setSnapshots: (s) => set({ snapshots: s }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e, loading: false }),
  setStreamStep: (s) => set({ streamStep: s }),
  setEngineUsed: (e) => set({ engineUsed: e }),
  setEngine: async (e) => {
    const category = get().activeTemplateCategory
    let engineToSet = e
    if (category === 'protocol' && e === 'openqasm') {
      engineToSet = 'custom'
    } else if (category === 'algorithm' && e === 'qunetsim') {
      engineToSet = 'custom'
    }
    set({ engine: engineToSet })
    // Refetch active template code for the newly selected engine
    const activeTemplate = get().activeTemplate
    if (activeTemplate) {
      await get().loadTemplate(activeTemplate)
    }
  },

  runSimulation: async (code) => {
    const { engine, noiseModel, computeTarget } = get()
    set({ loading: true, error: null })
    try {
      const response = await simulateWorkspaceProgram(code, engine, {
        noiseModel: noiseModel === 'ideal' ? undefined : noiseModel,
        preferGpu: computeTarget === 'gpu',
      })

      set({ simulationResponse: response, loading: false, error: null })

      // FIX 1: Point to the new 'summary' block instead of 'final_state'
      // We use a fallback just in case old cached data passes through
      const summaryData = (response as any).summary || (response as any).final_state || {}
      const nQubits = summaryData.qubits?.length || 0
      const dim = nQubits > 0 ? (1 << nQubits) : 0

      // Build snapshots from response steps
      const rawSteps = (response as any).steps || []
      const snapshots: StepSnapshot[] = rawSteps.map((step: any, idx: number) => {
        // FIX 2: Add optional chaining (?.) to state so it never crashes even if a step is missing math
        const flat: number[] = step.state?.statevector || []
        const sv = new Float64Array(flat)
        const probs = new Float64Array(dim)
        for (let i = 0; i < dim; i++) {
          const re = sv[2 * i] || 0
          const im = sv[2 * i + 1] || 0
          probs[i] = re * re + im * im
        }
        return {
          step: idx,
          gateLabel: step.instruction?.opcode || "UNKNOWN",
          sv,
          probs,
        }
      })

      // Build result from last step's statevector
      const lastSnap = snapshots[snapshots.length - 1]
      const stateVector: Complex[] = lastSnap ? Array.from({ length: dim }, (_, i) => ({
        re: lastSnap.sv[2 * i] || 0,
        im: lastSnap.sv[2 * i + 1] || 0,
      })) : Array.from({ length: dim }, () => ({ re: 0, im: 0 }))

      // Bloch vectors from root-level response (new schema)
      const blochVecs = (response as any).bloch_vectors || []
      const blochVectors = blochVecs.map((bv: any) => ({
        qubit: bv.qubit,
        x: bv.x,
        y: bv.y,
        z: bv.z,
        purity: bv.purity,
      }))

      // Probabilities from last snapshot
      const probabilities = lastSnap ? lastSnap.probs : new Float64Array(dim)

      // DEBUG: Add aggressive logging to diagnose blank UI
      console.log("[SIM_DEBUG] Raw Response:", response)
      console.log("[SIM_DEBUG] Calculated Snapshots:", snapshots)
      console.log("[SIM_DEBUG] Final Result Object:", { stateVector, probabilities, blochVectors })

      set({
        result: {
          stateVector,
          probabilities,
          fidelity: 1.0,
          nQubits,
          shots: 0,
          blochVectors,
          counts: {},
        },
        snapshots,
      })
    } catch (err) {
      console.error("[SIM_ERROR] API Request Failed:", err);
      set({ error: err instanceof Error ? err.message : 'Simulation failed.', loading: false })
    }
  },
  setPreflightOpen: (v) => set({ preflightOpen: v }),
  setNoiseModel: (m) => set({ noiseModel: m }),
  setComputeTarget: (t) => set({ computeTarget: t }),
  setSystemHardware: (h) => set({ systemHardware: h }),
  setWalkthroughOpen: (v) => set({ walkthroughOpen: v }),
  setWalkthroughStep: (s) => set({ walkthroughStep: s }),
  setOpenForWalkthrough: (v) => set({ openForWalkthrough: v }),

  loadTemplate: async (template) => {
    const params: Record<string, any> = {}
    if (template.parameters) {
      template.parameters.forEach(p => { params[p.name] = p.default })
    }
    const category: 'algorithm' | 'protocol' = template.kind === 'protocol' ? 'protocol' : 'algorithm'

    // 1. Always set template metadata — NEVER touch `engine` here
    set({
      activeTemplate: template,
      activeTemplateBaseCode: template.code,
      templateParams: params,
      activeTemplateCategory: category,
      result: null,
      snapshots: [],
      streamStep: 0,
      error: null
    })

    // 2. Fetch code from backend API using current engine
    const apiEngine = get().engine
    const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000'
    try {
      const authToken = await getAuthToken()
      console.log("Fetching template:", template.id, "for engine:", apiEngine)
      const res = await fetch(`${API_BASE}/api/templates/${apiEngine}/${template.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        const fetchedCode = data.code as string
        set({ activeTemplateBaseCode: fetchedCode })
        return fetchedCode
      }
      if (res.status === 404) {
        const msg = '// Template not yet available in this language. Please write your code here or switch engines.'
        set({ activeTemplateBaseCode: msg })
        return msg
      }
    } catch (error) {
      console.error("API Call Failed (loadTemplate):", error)
    }

    // 3. Fallback: local hydration (offline / unsupported engine)
    const preset = languagePresets[template.id]
    if (preset && apiEngine !== 'custom') {
      const presetCode = preset[apiEngine] ?? PRESET_UNAVAILABLE(apiEngine)
      set({ activeTemplateBaseCode: presetCode })
      return presetCode
    }

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
    set({ activeTemplateBaseCode: hydrated })
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
