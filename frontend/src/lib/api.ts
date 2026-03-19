import axios from 'axios'
import type {
  Circuit, SimulationResult, NoisySimulationResult,
  NoiseModel, QDDGraph, ProtocolResult, AlgorithmResult,
  GroverParams, ShorParams, QAOAParams, SimulateRequest
} from './types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Health ────────────────────────────────────────────────────────
export const checkHealth = async () => {
  const { data } = await api.get<{ status: string; gpu: boolean; version: string }>('/health')
  return data
}

// ── Simulation ────────────────────────────────────────────────────
export const simulate = async (req: SimulateRequest): Promise<SimulationResult> => {
  const { data } = await api.post<SimulationResult>('/api/simulate', req)
  return data
}

export const simulateNoisy = async (
  circuit: Circuit,
  noiseModel: NoiseModel,
  shots = 1024
): Promise<NoisySimulationResult> => {
  const { data } = await api.post<NoisySimulationResult>('/api/noise/simulate', {
    circuit, noiseModel, shots
  })
  return data
}

// SSE streaming simulation — returns an EventSource
export const streamSimulation = (circuitId: string, backend: 'statevector' | 'qdd') => {
  const url = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/simulate/stream?circuit_id=${circuitId}&backend=${backend}`
  return new EventSource(url)
}

// ── QDD ───────────────────────────────────────────────────────────
export const getQDDGraph = async (circuit: Circuit): Promise<QDDGraph> => {
  const { data } = await api.post<QDDGraph>('/api/qdd/graph', { circuit })
  return data
}

// ── Noise models ──────────────────────────────────────────────────
export const listNoiseModels = async (): Promise<NoiseModel[]> => {
  const { data } = await api.get<NoiseModel[]>('/api/noise/models')
  return data
}

// ── Protocols ─────────────────────────────────────────────────────
export const runBB84 = async (params: {
  numBits: number
  evePresent: boolean
  channelErrorRate?: number
}): Promise<ProtocolResult> => {
  const { data } = await api.post<ProtocolResult>('/api/protocols/bb84', params)
  return data
}

export const runTeleportation = async (params: {
  inputState: { alpha: number; beta: number }
  noisy?: boolean
  noiseModel?: NoiseModel
}): Promise<ProtocolResult> => {
  const { data } = await api.post<ProtocolResult>('/api/protocols/teleport', params)
  return data
}

export const runSuperdenseCoding = async (params: {
  message: '00' | '01' | '10' | '11'
}): Promise<ProtocolResult> => {
  const { data } = await api.post<ProtocolResult>('/api/protocols/superdense', params)
  return data
}

// ── Algorithms ────────────────────────────────────────────────────
export const runGrover = async (params: GroverParams): Promise<AlgorithmResult> => {
  const { data } = await api.post<AlgorithmResult>('/api/algorithms/grover', params)
  return data
}

export const runShor = async (params: ShorParams): Promise<AlgorithmResult> => {
  const { data } = await api.post<AlgorithmResult>('/api/algorithms/shor', params)
  return data
}

export const runQAOA = async (params: QAOAParams): Promise<AlgorithmResult> => {
  const { data } = await api.post<AlgorithmResult>('/api/algorithms/qaoa', params)
  return data
}

export default api
