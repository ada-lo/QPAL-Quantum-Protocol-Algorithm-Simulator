// ── Gate types ────────────────────────────────────────────────────
export type GateType =
  | 'H' | 'X' | 'Y' | 'Z'
  | 'S' | 'T' | 'Sdg' | 'Tdg'
  | 'CNOT' | 'CZ' | 'SWAP' | 'CCX'
  | 'RX' | 'RY' | 'RZ'
  | 'P' | 'U'
  | 'MEASURE'

export interface Gate {
  id: string
  type: GateType
  qubit: number           // target qubit index
  controlQubit?: number   // for controlled gates
  controlQubit2?: number  // for CCX
  column: number          // time step in circuit
  params?: {              // rotation angles etc.
    theta?: number
    phi?: number
    lambda?: number
  }
  label?: string          // custom display label
}

// ── Circuit ───────────────────────────────────────────────────────
export interface Circuit {
  id: string
  name: string
  numQubits: number
  gates: Gate[]
  shots: number
  createdAt: string
  updatedAt: string
}

// ── Quantum state ─────────────────────────────────────────────────
export interface Amplitude {
  basis: string           // e.g. "|00⟩"
  real: number
  imag: number
  probability: number     // |amplitude|²
  phase: number           // arg(amplitude) in radians
}

export interface QubitState {
  qubitIndex: number
  blochX: number          // Bloch vector X ∈ [-1, 1]
  blochY: number          // Bloch vector Y ∈ [-1, 1]
  blochZ: number          // Bloch vector Z ∈ [-1, 1]
  purity: number          // Tr(ρ²) ∈ [1/d, 1]
}

export interface SimulationStep {
  stepIndex: number
  gateApplied: Gate | null
  stateVector: Amplitude[]
  qubitStates: QubitState[]
  entanglementMatrix: number[][]  // pairwise concurrence
  timestamp: number
}

export interface SimulationResult {
  circuitId: string
  backend: 'statevector' | 'qdd' | 'aer_noisy'
  numQubits: number
  steps: SimulationStep[]
  finalCounts: Record<string, number>
  executionTimeMs: number
  gpuUsed: boolean
}

// ── Noise ─────────────────────────────────────────────────────────
export type NoiseModelType =
  | 'depolarizing'
  | 'amplitude_damping'
  | 'phase_flip'
  | 'bit_flip'
  | 'thermal_relaxation'
  | 'readout_error'

export interface NoiseChannel {
  type: NoiseModelType
  errorRate: number         // 0.0 – 1.0
  targetQubits: 'all' | number[]
  t1?: number               // T1 relaxation time (μs)
  t2?: number               // T2 dephasing time (μs)
  gateTime?: number         // gate duration (ns)
}

export interface NoiseModel {
  id: string
  name: string
  description: string
  channels: NoiseChannel[]
  preset?: 'ideal' | 'nisq_mild' | 'nisq_moderate' | 'nisq_severe' | 'custom'
}

export interface FidelityDecay {
  stepIndex: number
  fidelity: number          // F ∈ [0, 1]
  purity: number
  traceDistance: number
}

export interface NoisySimulationResult extends SimulationResult {
  noiseModel: NoiseModel
  idealComparison?: SimulationResult
  fidelityDecay: FidelityDecay[]
  noisyBlochStates: QubitState[][]   // per step per qubit
}

// ── QDD ───────────────────────────────────────────────────────────
export interface QDDNode {
  id: string
  variable: string          // qubit label e.g. "q0"
  level: number
  isTerminal: boolean
  value?: number            // for terminal nodes
}

export interface QDDEdge {
  source: string
  target: string
  weight: { real: number; imag: number }
  isLow: boolean            // false = high edge
}

export interface QDDGraph {
  nodes: QDDNode[]
  edges: QDDEdge[]
  numQubits: number
  numNodes: number          // measure of compression
  equivalentAmplitudes: number
  compressionRatio: number  // full / QDD node count
}

// ── Protocols ─────────────────────────────────────────────────────
export type ProtocolType = 'BB84' | 'teleportation' | 'superdense_coding' | 'E91'

export interface BB84Step {
  stepIndex: number
  party: 'alice' | 'bob' | 'eve' | 'channel'
  action: string
  aliceBits?: number[]
  aliceBases?: string[]
  bobBases?: string[]
  bobMeasurements?: number[]
  eveBases?: string[]
  eveMeasurements?: number[]
  siftedKey?: number[]
  errorRate?: number
  description: string
}

export interface TeleportationStep {
  stepIndex: number
  party: 'alice' | 'bob' | 'channel'
  action: string
  stateVector?: Amplitude[]
  classicalBits?: [number, number]
  description: string
}

export interface ProtocolResult {
  type: ProtocolType
  steps: BB84Step[] | TeleportationStep[]
  evePresent: boolean
  errorRate: number
  keyLength?: number
  success: boolean
}

// ── Algorithms ────────────────────────────────────────────────────
export type AlgorithmType = 'grover' | 'shor' | 'qaoa'

export interface GroverParams {
  numQubits: number
  targetState: string       // e.g. "101"
  numIterations?: number    // auto if not specified
}

export interface ShorParams {
  N: number                 // number to factor (≤ 21 for demo)
  a?: number                // co-prime base
}

export interface QAOAParams {
  numQubits: number
  problem: 'maxcut' | 'tsp_small'
  layers: number            // p parameter
  graph?: { nodes: number[]; edges: [number, number][] }
}

export interface AlgorithmStep {
  stepIndex: number
  label: string
  description: string
  circuit?: Circuit
  stateVector?: Amplitude[]
  probability?: Record<string, number>
  annotation?: string
}

export interface AlgorithmResult {
  type: AlgorithmType
  params: GroverParams | ShorParams | QAOAParams
  steps: AlgorithmStep[]
  answer: string | number
  successProbability: number
  executionTimeMs: number
}

// ── API request/response ──────────────────────────────────────────
export interface SimulateRequest {
  circuit: Circuit
  backend: 'statevector' | 'qdd'
  noiseModel?: NoiseModel
  shots?: number
  returnSteps?: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}
