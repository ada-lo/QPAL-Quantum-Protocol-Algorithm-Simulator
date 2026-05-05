import { create } from "zustand"
import type { StepSnapshot } from "@/lib/quantum/simulator"
import type { WorkspaceSystemCapabilities, WorkspaceTemplate, WorkspaceSimulationResponse } from "@/lib/workspace/types"
import { languagePresets, PRESET_UNAVAILABLE } from "@/utils/languagePresets"
import { simulateWorkspaceProgram } from "@/lib/workspace/api"
import { getAuthToken } from "@/lib/auth/authClient"
import { getTopicByCatalogKey } from "@/lib/learning/topicCatalog"
import { buildInitialInputValues, buildPreviewCode } from "@/lib/learning/topicTemplateUtils"

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
  applySimulationResponse: (response: WorkspaceSimulationResponse, engineUsed?: string) => void
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
  setActiveTemplateContext: (
    template: WorkspaceTemplate,
    engine: 'custom' | 'openqasm' | 'qunetsim',
    baseCode?: string | null,
  ) => void
  clearActiveTemplateContext: (engine: 'custom' | 'openqasm' | 'qunetsim', category: 'algorithm' | 'protocol' | null) => void

  reset: () => void
}

function hydrateTemplateCode(
  template: WorkspaceTemplate | null,
  baseCode: string,
  params: Record<string, any>,
  engine: "custom" | "openqasm" | "qunetsim",
) {
  const topic = template ? getTopicByCatalogKey(template.id) : null
  if (topic?.inputs?.length) {
    return buildPreviewCode(topic, params, template, engine)
  }

  let hydrated = baseCode
  for (const [k, v] of Object.entries(params)) {
    hydrated = hydrated.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v))
  }

  if (template?.id === "deutsch" && params.oracle_mode !== undefined) {
    const oracleMode = String(params.oracle_mode)
    const oracleVariants: Record<string, { label: string; gates: string }> = {
      "constant-0": {
        label: "Oracle: f(x)=0",
        gates: baseCode.includes("OPENQASM 3.0;") ? "// No oracle action needed" : "NOTE No oracle action needed",
      },
      "constant-1": {
        label: "Oracle: f(x)=1",
        gates: baseCode.includes("OPENQASM 3.0;") ? "x q[1];" : "X q1",
      },
      balanced: {
        label: "Oracle: balanced f(x)=x",
        gates: baseCode.includes("OPENQASM 3.0;") ? "cx q[0], q[1];" : "CNOT q0 q1",
      },
    }
    const oracleConfig = oracleVariants[oracleMode] ?? oracleVariants.balanced
    hydrated = hydrated.replace(/\{\{oracle_label\}\}/g, oracleConfig.label)
    hydrated = hydrated.replace(/\{\{oracle_gates\}\}/g, oracleConfig.gates)
  }

  if (params["hidden_string"] !== undefined) {
    const s = String(params["hidden_string"])
    const n = s.length
    const cnots = s.split("").map((bit, idx) => bit === "1" ? `CNOT q${idx} q${n}` : "").filter(Boolean).join("\n")
    hydrated = hydrated.replace(/\{\{oracle_gates\}\}/g, cnots || "NOTE zero string")
  }

  return hydrated
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
  applySimulationResponse: (response, engineUsed) => {
    const nQubits = response.summary.qubits.length
    const dim = nQubits > 0 ? (1 << nQubits) : 0

    const snapshots: StepSnapshot[] = response.steps.map((step, idx) => {
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

    const rootFlat = response.statevector
    const lastSnap = snapshots[snapshots.length - 1]
    const finalFlat = lastSnap ? Array.from(lastSnap.sv) : rootFlat
    const stateVector: Complex[] = Array.from({ length: dim }, (_, i) => ({
      re: finalFlat[2 * i] || 0,
      im: finalFlat[2 * i + 1] || 0,
    }))

    const blochVectors = response.bloch_vectors.map((bv) => ({
      qubit: bv.qubit,
      x: bv.x,
      y: bv.y,
      z: bv.z,
      purity: bv.purity,
    }))

    const probabilities = lastSnap
      ? Array.from(lastSnap.probs)
      : Array.from({ length: dim }, (_, i) => {
          const re = finalFlat[2 * i] || 0
          const im = finalFlat[2 * i + 1] || 0
          return re * re + im * im
        })

    set({
      simulationResponse: response,
      loading: false,
      error: null,
      engineUsed: engineUsed ?? response.engine,
      result: {
        stateVector,
        probabilities,
        fidelity: 1.0,
        nQubits,
        shots: response.shots ?? response.summary.measurements ?? 0,
        blochVectors,
        counts: response.counts ?? {},
      },
      snapshots,
    })
  },

  runSimulation: async (code) => {
    const { engine, noiseModel, computeTarget } = get()
    set({ loading: true, error: null })
    try {
      const response = await simulateWorkspaceProgram(code, engine, {
        noiseModel: noiseModel === 'ideal' ? undefined : noiseModel,
        preferGpu: computeTarget === 'gpu',
      })
      get().applySimulationResponse(response, response.engine || engine)
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
    const topic = getTopicByCatalogKey(template.id)
    const params: Record<string, any> = topic?.inputs?.length
      ? buildInitialInputValues(topic)
      : {}
    if (!topic?.inputs?.length && template.parameters) {
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

    const hydrated = hydrateTemplateCode(template, template.code, params, apiEngine)
    set({ activeTemplateBaseCode: hydrated })
    return hydrated
  },

  updateParameter: (key, value) => {
    const { activeTemplate, activeTemplateBaseCode, templateParams } = get()
    if (!activeTemplateBaseCode) return null

    const newParams = { ...templateParams, [key]: value }
    set({ templateParams: newParams })

    return hydrateTemplateCode(activeTemplate, activeTemplateBaseCode, newParams, get().engine)
  },

  setActiveTemplateContext: (template, engine, baseCode = null) => {
    const topic = getTopicByCatalogKey(template.id)
    const params: Record<string, any> = topic?.inputs?.length
      ? buildInitialInputValues(topic)
      : {}
    if (!topic?.inputs?.length && template.parameters) {
      template.parameters.forEach((p) => { params[p.name] = p.default })
    }
    const category: 'algorithm' | 'protocol' = template.kind === 'protocol' ? 'protocol' : 'algorithm'

    set({
      engine,
      activeTemplate: template,
      activeTemplateBaseCode: baseCode ?? template.code,
      templateParams: params,
      activeTemplateCategory: category,
      result: null,
      snapshots: [],
      simulationResponse: null,
      streamStep: 0,
      error: null,
    })
  },

  clearActiveTemplateContext: (engine, category) => set({
    activeTemplate: null,
    activeTemplateBaseCode: null,
    templateParams: {},
    activeTemplateCategory: category,
    engine,
    result: null,
    snapshots: [],
    simulationResponse: null,
    streamStep: 0,
    error: null,
  }),

  reset: () => set({ result: null, snapshots: [], loading: false, error: null, streamStep: 0 }),
}))
