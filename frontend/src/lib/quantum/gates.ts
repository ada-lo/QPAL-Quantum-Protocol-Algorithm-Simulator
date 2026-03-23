// ── Gate definitions for Quirk-like circuit simulator ──────────────────────

export type GateId =
  // Single qubit - Pauli
  | 'H' | 'X' | 'Y' | 'Z'
  // Single qubit - Phase
  | 'S' | 'T' | 'Sdg' | 'Tdg'
  // Single qubit - Roots
  | 'SX'    // √X
  // Rotations
  | 'Rx' | 'Ry' | 'Rz'
  // Identity
  | 'I'
  // Two qubit
  | 'CNOT' | 'SWAP' | 'CZ'
  // Three qubit
  | 'TOFFOLI'
  // Measurement
  | 'MEASURE'
  // Controls (pseudo-gates placed in same column as target gate)
  | 'CTRL'   // ● control
  | 'ACTRL'  // ○ anti-control
  // Displays (inline state visualizations)
  | 'CHANCE' | 'AMPS' | 'BLOCH' | 'DENSITY'

export type GateCategory = 'pauli' | 'phase' | 'rotation' | 'multi' | 'control' | 'display' | 'measure'

export interface GateDef {
  id: GateId
  label: string
  color: string
  qubits: number       // 1 | 2 | 3
  description: string
  category: GateCategory
  hasAngle?: boolean    // for rotation gates
  isDisplay?: boolean   // for inline display gates
  isControl?: boolean   // for control pseudo-gates
}

export const GATES: Record<GateId, GateDef> = {
  // ── Pauli gates ──
  H:       { id: 'H',       label: 'H',    color: '#4FC3F7', qubits: 1, description: 'Hadamard — creates equal superposition', category: 'pauli' },
  X:       { id: 'X',       label: 'X',    color: '#EF5350', qubits: 1, description: 'Pauli-X — quantum NOT gate', category: 'pauli' },
  Y:       { id: 'Y',       label: 'Y',    color: '#66BB6A', qubits: 1, description: 'Pauli-Y gate', category: 'pauli' },
  Z:       { id: 'Z',       label: 'Z',    color: '#AB47BC', qubits: 1, description: 'Pauli-Z — phase flip', category: 'pauli' },

  // ── Phase gates ──
  S:       { id: 'S',       label: 'S',    color: '#26A69A', qubits: 1, description: 'S gate — π/2 phase rotation', category: 'phase' },
  T:       { id: 'T',       label: 'T',    color: '#FF7043', qubits: 1, description: 'T gate — π/4 phase rotation', category: 'phase' },
  Sdg:     { id: 'Sdg',     label: 'S†',   color: '#26A69A', qubits: 1, description: 'S† — inverse S gate', category: 'phase' },
  Tdg:     { id: 'Tdg',     label: 'T†',   color: '#FF7043', qubits: 1, description: 'T† — inverse T gate', category: 'phase' },
  SX:      { id: 'SX',      label: '√X',   color: '#E91E63', qubits: 1, description: '√X — square root of X', category: 'phase' },
  I:       { id: 'I',       label: 'I',    color: '#546E7A', qubits: 1, description: 'Identity — no operation (wire spacer)', category: 'phase' },

  // ── Rotation gates ──
  Rx:      { id: 'Rx',      label: 'Rx',   color: '#EF5350', qubits: 1, description: 'X-axis rotation by angle θ', category: 'rotation', hasAngle: true },
  Ry:      { id: 'Ry',      label: 'Ry',   color: '#66BB6A', qubits: 1, description: 'Y-axis rotation by angle θ', category: 'rotation', hasAngle: true },
  Rz:      { id: 'Rz',      label: 'Rz',   color: '#AB47BC', qubits: 1, description: 'Z-axis rotation by angle θ', category: 'rotation', hasAngle: true },

  // ── Multi-qubit gates ──
  CNOT:    { id: 'CNOT',    label: 'CNOT', color: '#42A5F5', qubits: 2, description: 'Controlled-NOT — creates entanglement', category: 'multi' },
  SWAP:    { id: 'SWAP',    label: 'SWAP', color: '#42A5F5', qubits: 2, description: 'Swap two qubits', category: 'multi' },
  CZ:      { id: 'CZ',      label: 'CZ',   color: '#AB47BC', qubits: 2, description: 'Controlled-Z gate', category: 'multi' },
  TOFFOLI: { id: 'TOFFOLI', label: 'CCX',  color: '#FF6F00', qubits: 3, description: 'Toffoli — doubly controlled NOT', category: 'multi' },

  // ── Measurement ──
  MEASURE: { id: 'MEASURE', label: 'M',    color: '#78909C', qubits: 1, description: 'Measurement in computational (Z) basis', category: 'measure' },

  // ── Controls ──
  CTRL:    { id: 'CTRL',    label: '●',    color: '#212121', qubits: 1, description: 'Control — conditions on |1⟩', category: 'control', isControl: true },
  ACTRL:   { id: 'ACTRL',   label: '○',    color: '#BDBDBD', qubits: 1, description: 'Anti-control — conditions on |0⟩', category: 'control', isControl: true },

  // ── Inline displays ──
  CHANCE:  { id: 'CHANCE',  label: '%',    color: '#2E7D32', qubits: 1, description: 'Chance display — shows probabilities', category: 'display', isDisplay: true },
  AMPS:    { id: 'AMPS',    label: 'Amp',  color: '#1565C0', qubits: 1, description: 'Amplitude display — magnitude + phase', category: 'display', isDisplay: true },
  BLOCH:   { id: 'BLOCH',   label: 'B',    color: '#6A1B9A', qubits: 1, description: 'Bloch sphere display', category: 'display', isDisplay: true },
  DENSITY: { id: 'DENSITY', label: 'ρ',    color: '#4E342E', qubits: 1, description: 'Density matrix display', category: 'display', isDisplay: true },
}

// ── Gate groups by category ──
export const SINGLE_QUBIT_GATES: GateId[] = ['H', 'X', 'Y', 'Z']
export const PHASE_GATES: GateId[] = ['S', 'T', 'Sdg', 'Tdg', 'SX']
export const ROTATION_GATES: GateId[] = ['Rx', 'Ry', 'Rz']
export const TWO_QUBIT_GATES: GateId[] = ['CNOT', 'SWAP', 'CZ']
export const THREE_QUBIT_GATES: GateId[] = ['TOFFOLI']
export const CONTROL_GATES: GateId[] = ['CTRL', 'ACTRL']
export const DISPLAY_GATES: GateId[] = ['CHANCE', 'AMPS', 'BLOCH', 'DENSITY']
export const MEASURE_GATES: GateId[] = ['MEASURE']

// ── Toolbox layout (top & bottom rows) ──
export const TOP_TOOLBOX = [
  { label: 'Common',    ids: SINGLE_QUBIT_GATES },
  { label: 'Phase',     ids: PHASE_GATES },
  { label: 'Rotations', ids: ROTATION_GATES },
  { label: 'Controls',  ids: CONTROL_GATES },
]

export const BOTTOM_TOOLBOX = [
  { label: 'Multi-qubit', ids: [...TWO_QUBIT_GATES, ...THREE_QUBIT_GATES] },
  { label: 'Measure',     ids: MEASURE_GATES },
  { label: 'Displays',    ids: DISPLAY_GATES },
]
