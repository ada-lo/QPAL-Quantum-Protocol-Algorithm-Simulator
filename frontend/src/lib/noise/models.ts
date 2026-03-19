export type NoiseModelId = 'ideal' | 'depolarizing' | 'amplitude_damping' | 'phase_flip' | 'thermal'

export interface NoiseModel {
  id: NoiseModelId
  label: string
  description: string
  params: NoiseParam[]
  color: string
}

export interface NoiseParam {
  key: string
  label: string
  min: number
  max: number
  default: number
  step: number
  unit: string
}

export const NOISE_MODELS: NoiseModel[] = [
  {
    id: 'ideal',
    label: 'Ideal (noiseless)',
    description: 'Perfect quantum operations with no decoherence',
    params: [],
    color: 'var(--accent-green)',
  },
  {
    id: 'depolarizing',
    label: 'Depolarizing',
    description: 'Random X, Y, Z errors with equal probability p',
    params: [{ key: 'p', label: 'Error rate p', min: 0, max: 0.5, default: 0.01, step: 0.001, unit: '' }],
    color: 'var(--accent-amber)',
  },
  {
    id: 'amplitude_damping',
    label: 'Amplitude damping',
    description: 'Energy relaxation (T1 decay) — |1⟩ → |0⟩ with prob γ',
    params: [{ key: 'gamma', label: 'Decay rate γ', min: 0, max: 1, default: 0.05, step: 0.005, unit: '' }],
    color: 'var(--accent-red)',
  },
  {
    id: 'phase_flip',
    label: 'Phase flip (dephasing)',
    description: 'T2 dephasing — loses phase coherence with prob p',
    params: [{ key: 'p', label: 'Dephasing prob p', min: 0, max: 0.5, default: 0.02, step: 0.002, unit: '' }],
    color: 'var(--accent-purple)',
  },
  {
    id: 'thermal',
    label: 'Thermal relaxation',
    description: 'Combined T1/T2 decay matching real NISQ hardware',
    params: [
      { key: 't1', label: 'T1 (μs)', min: 1, max: 500, default: 100, step: 1, unit: 'μs' },
      { key: 't2', label: 'T2 (μs)', min: 1, max: 300, default: 80, step: 1, unit: 'μs' },
      { key: 'tgate', label: 'Gate time (ns)', min: 10, max: 1000, default: 50, step: 10, unit: 'ns' },
    ],
    color: 'var(--accent-cyan)',
  },
]
