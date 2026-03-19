import type { GateType, NoiseModel } from './types'

// ── Gate palette ──────────────────────────────────────────────────
export interface GateDefinition {
  type: GateType
  label: string
  description: string
  color: string           // Tailwind class suffix e.g. "gate-h"
  numQubits: 1 | 2 | 3
  hasParams: boolean
  paramLabels?: string[]
}

export const GATE_PALETTE: GateDefinition[] = [
  // Single-qubit
  { type: 'H',    label: 'H',    description: 'Hadamard — creates superposition',      color: 'gate-h',    numQubits: 1, hasParams: false },
  { type: 'X',    label: 'X',    description: 'Pauli-X — bit flip',                   color: 'gate-x',    numQubits: 1, hasParams: false },
  { type: 'Y',    label: 'Y',    description: 'Pauli-Y — bit + phase flip',            color: 'gate-y',    numQubits: 1, hasParams: false },
  { type: 'Z',    label: 'Z',    description: 'Pauli-Z — phase flip',                  color: 'gate-z',    numQubits: 1, hasParams: false },
  { type: 'S',    label: 'S',    description: 'S gate — √Z, π/2 phase',               color: 'gate-s',    numQubits: 1, hasParams: false },
  { type: 'T',    label: 'T',    description: 'T gate — ⁴√Z, π/4 phase',              color: 'gate-t',    numQubits: 1, hasParams: false },
  { type: 'RX',   label: 'Rx',   description: 'Rotation about X axis',                 color: 'gate-rx',   numQubits: 1, hasParams: true, paramLabels: ['θ'] },
  { type: 'RY',   label: 'Ry',   description: 'Rotation about Y axis',                 color: 'gate-ry',   numQubits: 1, hasParams: true, paramLabels: ['θ'] },
  { type: 'RZ',   label: 'Rz',   description: 'Rotation about Z axis',                 color: 'gate-rz',   numQubits: 1, hasParams: true, paramLabels: ['θ'] },
  // Two-qubit
  { type: 'CNOT', label: 'CX',   description: 'Controlled-NOT — entangling gate',      color: 'gate-cnot', numQubits: 2, hasParams: false },
  { type: 'CZ',   label: 'CZ',   description: 'Controlled-Z',                          color: 'gate-z',    numQubits: 2, hasParams: false },
  { type: 'SWAP', label: 'SW',   description: 'SWAP two qubits',                       color: 'gate-swap', numQubits: 2, hasParams: false },
  // Three-qubit
  { type: 'CCX',  label: 'CCX',  description: 'Toffoli — doubly controlled NOT',       color: 'gate-cnot', numQubits: 3, hasParams: false },
  // Measurement
  { type: 'MEASURE', label: 'M', description: 'Measure qubit in computational basis',  color: 'gate-m',    numQubits: 1, hasParams: false },
]

export const GATE_COLOR_MAP: Record<GateType, string> = {
  H:       '#00d4ff',
  X:       '#f59e0b',
  Y:       '#10b981',
  Z:       '#8b5cf6',
  S:       '#06b6d4',
  T:       '#f97316',
  Sdg:     '#06b6d4',
  Tdg:     '#f97316',
  CNOT:    '#ef4444',
  CZ:      '#8b5cf6',
  SWAP:    '#a855f7',
  CCX:     '#ef4444',
  RX:      '#84cc16',
  RY:      '#ec4899',
  RZ:      '#14b8a6',
  P:       '#6366f1',
  U:       '#a78bfa',
  MEASURE: '#6b7280',
}

// ── Noise presets ─────────────────────────────────────────────────
export const DEFAULT_NOISE_MODEL_IDEAL: NoiseModel = {
  id: 'ideal',
  name: 'Ideal (noiseless)',
  description: 'No noise — perfect quantum gates',
  channels: [],
  preset: 'ideal',
}

export const NOISE_PRESET_NISQ_MILD: NoiseModel = {
  id: 'nisq_mild',
  name: 'NISQ — mild noise',
  description: 'Realistic mild noise (similar to good superconducting qubits)',
  preset: 'nisq_mild',
  channels: [
    { type: 'depolarizing',     errorRate: 0.001, targetQubits: 'all' },
    { type: 'amplitude_damping',errorRate: 0.002, targetQubits: 'all', t1: 100, t2: 70, gateTime: 50 },
    { type: 'readout_error',    errorRate: 0.01,  targetQubits: 'all' },
  ],
}

export const NOISE_PRESET_NISQ_MODERATE: NoiseModel = {
  id: 'nisq_moderate',
  name: 'NISQ — moderate noise',
  description: 'Moderate noise — visible decoherence effects',
  preset: 'nisq_moderate',
  channels: [
    { type: 'depolarizing',     errorRate: 0.005, targetQubits: 'all' },
    { type: 'amplitude_damping',errorRate: 0.01,  targetQubits: 'all', t1: 50, t2: 30, gateTime: 50 },
    { type: 'phase_flip',       errorRate: 0.003, targetQubits: 'all' },
    { type: 'readout_error',    errorRate: 0.03,  targetQubits: 'all' },
  ],
}

export const NOISE_PRESET_NISQ_SEVERE: NoiseModel = {
  id: 'nisq_severe',
  name: 'NISQ — severe noise',
  description: 'Severe noise — strong decoherence, useful for error correction demos',
  preset: 'nisq_severe',
  channels: [
    { type: 'depolarizing',     errorRate: 0.02,  targetQubits: 'all' },
    { type: 'amplitude_damping',errorRate: 0.05,  targetQubits: 'all', t1: 20, t2: 10, gateTime: 50 },
    { type: 'phase_flip',       errorRate: 0.015, targetQubits: 'all' },
    { type: 'readout_error',    errorRate: 0.08,  targetQubits: 'all' },
  ],
}

export const ALL_NOISE_PRESETS: NoiseModel[] = [
  DEFAULT_NOISE_MODEL_IDEAL,
  NOISE_PRESET_NISQ_MILD,
  NOISE_PRESET_NISQ_MODERATE,
  NOISE_PRESET_NISQ_SEVERE,
]

// ── Simulation limits ─────────────────────────────────────────────
export const MAX_QUBITS_STATEVECTOR = 20
export const MAX_QUBITS_QDD         = 50
export const MIN_QUBITS             = 1
export const MAX_SHOTS              = 65536
export const DEFAULT_SHOTS          = 1024

// ── Playback ──────────────────────────────────────────────────────
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4] as const
