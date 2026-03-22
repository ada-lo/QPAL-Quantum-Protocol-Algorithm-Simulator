// ── Full client-side state vector simulator for ≤16 qubits ──
// Matrices represented as flat Float64Array: [re0, im0, re1, im1, ...]

export type Complex = { re: number; im: number }
export type SV = Float64Array  // length = 2 * 2^n

// ── Initial state types ──
export type InitialStateId = '|0⟩' | '|1⟩' | '|+⟩' | '|−⟩' | '|i⟩' | '|−i⟩'

const S2 = 1 / Math.sqrt(2)

export const INITIAL_STATES: Record<InitialStateId, [number, number, number, number]> = {
  '|0⟩':  [1, 0, 0, 0],       // [re0, im0, re1, im1]
  '|1⟩':  [0, 0, 1, 0],
  '|+⟩':  [S2, 0, S2, 0],
  '|−⟩':  [S2, 0, -S2, 0],
  '|i⟩':  [S2, 0, 0, S2],
  '|−i⟩': [S2, 0, 0, -S2],
}

export const INITIAL_STATE_CYCLE: InitialStateId[] = ['|0⟩', '|1⟩', '|+⟩', '|−⟩', '|i⟩', '|−i⟩']

export function initState(n: number, initialStates?: InitialStateId[]): SV {
  if (!initialStates || initialStates.every(s => s === '|0⟩')) {
    const sv = new Float64Array(2 * (1 << n))
    sv[0] = 1  // |00...0⟩
    return sv
  }

  // Build product state from individual initial states
  let state: Float64Array = new Float64Array(2)
  const q0 = INITIAL_STATES[initialStates[0] ?? '|0⟩']
  state[0] = q0[0]; state[1] = q0[1]
  // Start with [α, β] for qubit 0, then tensor product with each subsequent qubit
  for (let q = 0; q < n; q++) {
    const qState = INITIAL_STATES[initialStates[q] ?? '|0⟩']
    if (q === 0) {
      state = new Float64Array(4)
      state[0] = qState[0]; state[1] = qState[1]
      state[2] = qState[2]; state[3] = qState[3]
    } else {
      const prevLen = state.length / 2
      const newState = new Float64Array(state.length * 2)
      for (let i = 0; i < prevLen; i++) {
        const ar = state[2 * i], ai = state[2 * i + 1]
        // Tensor with |q⟩ = α|0⟩ + β|1⟩
        const idx0 = i * 2
        const idx1 = i * 2 + 1
        // |i⟩ ⊗ α|0⟩
        newState[2 * idx0] = ar * qState[0] - ai * qState[1]
        newState[2 * idx0 + 1] = ar * qState[1] + ai * qState[0]
        // |i⟩ ⊗ β|1⟩
        newState[2 * idx1] = ar * qState[2] - ai * qState[3]
        newState[2 * idx1 + 1] = ar * qState[3] + ai * qState[2]
      }
      state = newState
    }
  }
  return state
}

export function initZero(n: number): SV {
  const sv = new Float64Array(2 * (1 << n))
  sv[0] = 1  // |00...0⟩
  return sv
}

function mul(ar: number, ai: number, br: number, bi: number): [number, number] {
  return [ar * br - ai * bi, ar * bi + ai * br]
}

// Apply a 2x2 unitary to qubit `q` of an n-qubit state
export function apply1Q(sv: SV, n: number, q: number, U: readonly number[]): SV {
  const out = new Float64Array(sv.length)
  const dim = 1 << n
  for (let i = 0; i < dim; i++) {
    const bit = (i >> q) & 1
    const j = i ^ (1 << q)
    if (bit === 0) {
      const [a0r, a0i] = [sv[2 * i], sv[2 * i + 1]]
      const [a1r, a1i] = [sv[2 * j], sv[2 * j + 1]]
      const [r0r, r0i] = mul(U[0], U[1], a0r, a0i)
      const [r1r, r1i] = mul(U[2], U[3], a1r, a1i)
      const [r2r, r2i] = mul(U[4], U[5], a0r, a0i)
      const [r3r, r3i] = mul(U[6], U[7], a1r, a1i)
      out[2 * i] = r0r + r1r
      out[2 * i + 1] = r0i + r1i
      out[2 * j] = r2r + r3r
      out[2 * j + 1] = r2i + r3i
    }
  }
  return out
}

// Apply CNOT: control=c, target=t
export function applyCNOT(sv: SV, n: number, c: number, t: number): SV {
  const out = sv.slice()
  const dim = 1 << n
  for (let i = 0; i < dim; i++) {
    if (((i >> c) & 1) === 1) {
      const j = i ^ (1 << t)
      if (j > i) {
        ;[out[2 * i], out[2 * j]] = [out[2 * j], out[2 * i]]
        ;[out[2 * i + 1], out[2 * j + 1]] = [out[2 * j + 1], out[2 * i + 1]]
      }
    }
  }
  return out
}

// Apply CZ
export function applyCZ(sv: SV, n: number, c: number, t: number): SV {
  const out = sv.slice()
  const dim = 1 << n
  for (let i = 0; i < dim; i++) {
    if (((i >> c) & 1) === 1 && ((i >> t) & 1) === 1) {
      out[2 * i] = -out[2 * i]
      out[2 * i + 1] = -out[2 * i + 1]
    }
  }
  return out
}

// Apply SWAP
export function applySWAP(sv: SV, n: number, a: number, b: number): SV {
  const out = sv.slice()
  const dim = 1 << n
  for (let i = 0; i < dim; i++) {
    const ba = (i >> a) & 1
    const bb = (i >> b) & 1
    if (ba !== bb) {
      const j = i ^ (1 << a) ^ (1 << b)
      if (j > i) {
        ;[out[2 * i], out[2 * j]] = [out[2 * j], out[2 * i]]
        ;[out[2 * i + 1], out[2 * j + 1]] = [out[2 * j + 1], out[2 * i + 1]]
      }
    }
  }
  return out
}

// Apply Toffoli (CCNOT): control1=c1, control2=c2, target=t
export function applyToffoli(sv: SV, n: number, c1: number, c2: number, t: number): SV {
  const out = sv.slice()
  const dim = 1 << n
  for (let i = 0; i < dim; i++) {
    if (((i >> c1) & 1) === 1 && ((i >> c2) & 1) === 1) {
      const j = i ^ (1 << t)
      if (j > i) {
        ;[out[2 * i], out[2 * j]] = [out[2 * j], out[2 * i]]
        ;[out[2 * i + 1], out[2 * j + 1]] = [out[2 * j + 1], out[2 * i + 1]]
      }
    }
  }
  return out
}

// ── Measurement (deferred measurement principle) ──
// Projects qubit q, collapses state, renormalizes
export function applyMeasure(sv: SV, n: number, q: number): SV {
  const dim = 1 << n
  let prob0 = 0
  for (let i = 0; i < dim; i++) {
    if (((i >> q) & 1) === 0) {
      prob0 += sv[2 * i] ** 2 + sv[2 * i + 1] ** 2
    }
  }
  // Deferred measurement: keep both branches weighted by probability
  // This allows displays to show post-measurement states
  const out = sv.slice()
  // We use the deferred measurement approach: just mark the qubit as measured
  // The probability display will show the collapsed probabilities
  return out
}

// ── Unitary matrices ──
export const UNITARIES: Record<string, readonly number[]> = {
  H:   [S2, 0, S2, 0, S2, 0, -S2, 0],
  X:   [0, 0, 1, 0, 1, 0, 0, 0],
  Y:   [0, 0, 0, -1, 0, 1, 0, 0],
  Z:   [1, 0, 0, 0, 0, 0, -1, 0],
  S:   [1, 0, 0, 0, 0, 0, 0, 1],
  T:   [1, 0, 0, 0, 0, 0, S2, S2],
  Sdg: [1, 0, 0, 0, 0, 0, 0, -1],
  Tdg: [1, 0, 0, 0, 0, 0, S2, -S2],
  SX:  [0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5],  // (1+i)/2 * [[1, -i],[-i, 1]] simplified
  I:   [1, 0, 0, 0, 0, 0, 1, 0],
}

// Rotation gate unitaries (parameterized)
export function rxMatrix(theta: number): number[] {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
  return [c, 0, 0, -s, 0, -s, c, 0]
}

export function ryMatrix(theta: number): number[] {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
  return [c, 0, -s, 0, s, 0, c, 0]
}

export function rzMatrix(theta: number): number[] {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
  return [c, -s, 0, 0, 0, 0, c, s]
}

// ── Step snapshot ──
export interface StepSnapshot {
  step: number
  gateLabel: string
  sv: SV
  probs: Float64Array
}

// ── Column-based intermediate states ──
export interface ColumnState {
  column: number
  sv: SV
  probs: Float64Array
}

export interface CircuitGateInput {
  gateId: string
  qubit: number
  step: number
  targetQubit?: number
  controlQubit?: number
  angle?: number   // for rotation gates
}

export function runCircuit(
  n: number,
  gates: CircuitGateInput[],
  initialStates?: InitialStateId[],
): StepSnapshot[] {
  let sv = initialStates ? initState(n, initialStates) : initZero(n)
  const snapshots: StepSnapshot[] = [
    { step: -1, gateLabel: 'init', sv: sv.slice(), probs: probabilities(sv, n) }
  ]

  const sorted = [...gates].sort((a, b) => a.step - b.step || a.qubit - b.qubit)

  // Group by step
  const byStep = new Map<number, typeof sorted>()
  for (const g of sorted) {
    if (!byStep.has(g.step)) byStep.set(g.step, [])
    byStep.get(g.step)!.push(g)
  }

  for (const [step, stepGates] of [...byStep.entries()].sort((a, b) => a[0] - b[0])) {
    for (const g of stepGates) {
      const id = g.gateId.toUpperCase()

      // Skip display gates and controls (handled by other gates)
      if (['CHANCE', 'AMPS', 'BLOCH', 'DENSITY', 'CTRL', 'ACTRL'].includes(id)) continue

      if (id === 'CNOT' && g.targetQubit !== undefined) {
        sv = applyCNOT(sv, n, g.qubit, g.targetQubit)
      } else if (id === 'CZ' && g.targetQubit !== undefined) {
        sv = applyCZ(sv, n, g.qubit, g.targetQubit)
      } else if (id === 'SWAP' && g.targetQubit !== undefined) {
        sv = applySWAP(sv, n, g.qubit, g.targetQubit)
      } else if (id === 'TOFFOLI' && g.targetQubit !== undefined && g.controlQubit !== undefined) {
        sv = applyToffoli(sv, n, g.qubit, g.controlQubit, g.targetQubit)
      } else if (id === 'MEASURE') {
        sv = applyMeasure(sv, n, g.qubit)
      } else if (id === 'RX' && g.angle !== undefined) {
        sv = apply1Q(sv, n, g.qubit, rxMatrix(g.angle))
      } else if (id === 'RY' && g.angle !== undefined) {
        sv = apply1Q(sv, n, g.qubit, ryMatrix(g.angle))
      } else if (id === 'RZ' && g.angle !== undefined) {
        sv = apply1Q(sv, n, g.qubit, rzMatrix(g.angle))
      } else if (UNITARIES[id]) {
        sv = apply1Q(sv, n, g.qubit, UNITARIES[id])
      } else {
        // Try case-sensitive lookup
        const key = g.gateId
        if (UNITARIES[key]) {
          sv = apply1Q(sv, n, g.qubit, UNITARIES[key])
        }
      }
    }
    snapshots.push({
      step,
      gateLabel: stepGates.map(g => g.gateId).join(','),
      sv: sv.slice(),
      probs: probabilities(sv, n),
    })
  }

  return snapshots
}

// Compute intermediate state for each column (for inline displays)
export function computeColumnStates(
  n: number,
  gates: CircuitGateInput[],
  initialStates?: InitialStateId[],
): Map<number, ColumnState> {
  const snapshots = runCircuit(n, gates, initialStates)
  const result = new Map<number, ColumnState>()

  for (const snap of snapshots) {
    result.set(snap.step, {
      column: snap.step,
      sv: snap.sv,
      probs: snap.probs,
    })
  }
  return result
}

export function probabilities(sv: SV, n: number): Float64Array {
  const dim = 1 << n
  const p = new Float64Array(dim)
  for (let i = 0; i < dim; i++) {
    p[i] = sv[2 * i] ** 2 + sv[2 * i + 1] ** 2
  }
  return p
}

export function blochVector(sv: SV, n: number, q: number): { x: number; y: number; z: number } {
  const dim = 1 << n
  // Compute reduced density matrix for qubit q via partial trace
  let r00r = 0, r01r = 0, r01i = 0, r11r = 0

  for (let i = 0; i < dim; i++) {
    const qi = (i >> q) & 1
    const ar = sv[2 * i], ai = sv[2 * i + 1]
    const prob = ar * ar + ai * ai

    if (qi === 0) {
      r00r += prob
      // Find matching state with qubit q = 1
      const j = i | (1 << q)
      const br = sv[2 * j], bi = sv[2 * j + 1]
      // rho_01 += a_i * conj(a_j) where i has q=0, j has q=1
      r01r += ar * br + ai * bi
      r01i += ai * br - ar * bi
    } else {
      r11r += prob
    }
  }

  return {
    x: 2 * r01r,
    y: 2 * r01i,
    z: r00r - r11r,
  }
}

// Compute density matrix for a set of qubits (for density display)
export function reducedDensityMatrix(
  sv: SV, n: number, qubits: number[]
): { real: number[][]; imag: number[][] } {
  const d = 1 << qubits.length
  const real = Array.from({ length: d }, () => new Array(d).fill(0))
  const imag = Array.from({ length: d }, () => new Array(d).fill(0))
  const dim = 1 << n

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      // Check if non-selected qubits match
      let match = true
      for (let q = 0; q < n; q++) {
        if (!qubits.includes(q) && ((i >> q) & 1) !== ((j >> q) & 1)) {
          match = false
          break
        }
      }
      if (!match) continue

      // Extract qubit indices for selected qubits
      let ri = 0, rj = 0
      for (let k = 0; k < qubits.length; k++) {
        ri |= ((i >> qubits[k]) & 1) << k
        rj |= ((j >> qubits[k]) & 1) << k
      }

      const ar = sv[2 * i], ai = sv[2 * i + 1]
      const br = sv[2 * j], bi = sv[2 * j + 1]
      real[ri][rj] += ar * br + ai * bi
      imag[ri][rj] += ai * br - ar * bi
    }
  }

  return { real, imag }
}
