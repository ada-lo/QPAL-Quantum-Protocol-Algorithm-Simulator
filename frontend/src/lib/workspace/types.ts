export type WorkspaceCategory = "quantum" | "transport" | "actor" | "annotation" | "macro"

export interface WorkspaceInstruction {
  line: number
  raw: string
  opcode: string
  args: string[]
  qubits: string[]
  actors: string[]
  basis?: "X" | "Z" | null
  label?: string | null
  category: WorkspaceCategory
  metadata: Record<string, string | number | boolean | null>
}

export interface WorkspaceParserIssue {
  line: number
  raw: string
  message: string
}

export interface WorkspaceParserResult {
  instructions: WorkspaceInstruction[]
  errors: WorkspaceParserIssue[]
  warnings: WorkspaceParserIssue[]
  qubits: string[]
  actors: string[]
}

export interface WorkspaceMeasurementRecord {
  qubit: string
  basis: "X" | "Z"
  value: number
  actor: string | null
  step: number
}

export interface WorkspaceTransmissionRecord {
  qubit: string
  from_actor: string | null
  to_actor: string | null
  status: "sent" | "intercepted" | "received"
  intercepted_by: string | null
  step: number
}

export interface WorkspaceBlochVector {
  qubit: string
  x: number
  y: number
  z: number
  purity?: number
}

export interface WorkspaceQubitState {
  id: string
  initialized: boolean
  state_label: string
  superposition: boolean
  owner: string | null
  location: string | null
  entangled_with: string[]
  intercepted_by: string | null
  last_operation: string | null
}

export interface WorkspaceActorState {
  name: string
  owned_qubits: string[]
}

export interface WorkspaceExecutionState {
  qubits: WorkspaceQubitState[]
  actors: WorkspaceActorState[]
  bloch_vectors: WorkspaceBlochVector[]
  measurements: WorkspaceMeasurementRecord[]
  transmissions: WorkspaceTransmissionRecord[]
  statevector: number[]  // flat [re0, im0, re1, im1, ...]
}

export interface WorkspaceExecutionStep {
  index: number
  instruction: WorkspaceInstruction
  event: string
  state?: WorkspaceExecutionState | null
}

export interface WorkspaceSummary {
  qubits: string[]
  actors: string[]
  total_steps: number
  measurements: number
}

/** Response for pure-math algorithm simulations (gate circuits, no networking). */
export interface WorkspaceAlgorithmResponse {
  kind: 'algorithm'
  engine: string
  summary: WorkspaceSummary
  steps: WorkspaceExecutionStep[]
  statevector: number[]   // flat [re0, im0, re1, im1, ...]
  bloch_vectors: WorkspaceBlochVector[]
  warnings: string[]
}

/** Response for networking protocol simulations (actors, transmissions, measurements). */
export interface WorkspaceProtocolResponse {
  kind: 'protocol'
  engine: string
  summary: WorkspaceSummary
  steps: WorkspaceExecutionStep[]
  actors: WorkspaceActorState[]
  transmissions: WorkspaceTransmissionRecord[]
  measurements: WorkspaceMeasurementRecord[]
  statevector: number[]   // flat [re0, im0, re1, im1, ...]
  bloch_vectors: WorkspaceBlochVector[]
  warnings: string[]
}

/** Discriminated union — the `kind` field selects which schema applies. */
export type WorkspaceSimulationResponse = WorkspaceAlgorithmResponse | WorkspaceProtocolResponse

export interface WorkspaceSyntaxItem {
  syntax: string
  description: string
  category: string
  example?: string | null
  expands_to?: string[] | null
}

export interface WorkspaceTemplateParameter {
  name: string
  label: string
  type: string
  default: any
}

export interface WorkspaceTemplate {
  id: string
  title: string
  kind: "protocol" | "algorithm" | "circuit" | "benchmark"
  description: string
  tags: string[]
  parameters?: WorkspaceTemplateParameter[]
  code: string
}

export interface WorkspaceBenchmarkProfile {
  id: string
  label: string
  description: string
  qubits: number
  family: string
}

export interface WorkspaceCatalogResponse {
  syntax: WorkspaceSyntaxItem[]
  templates: WorkspaceTemplate[]
  benchmarks: WorkspaceBenchmarkProfile[]
  architecture_notes: string[]
}

export interface WorkspaceSystemCapabilities {
  cpu: string
  cpu_cores: number
  gpu_available: boolean
  gpu_name?: string | null
  gpu_memory?: string | null
  gpu_driver?: string | null
}

export interface WorkspaceBenchmarkResult {
  id: string
  label: string
  family: string
  qubits: number
  depth: number
  gate_count: number
  duration_ms: number
  engine_used: string
  gpu_used: boolean
  notes?: string | null
}

export interface WorkspaceBenchmarkResponse {
  capabilities: WorkspaceSystemCapabilities
  results: WorkspaceBenchmarkResult[]
  used_gpu: boolean
  reference_note: string
}
