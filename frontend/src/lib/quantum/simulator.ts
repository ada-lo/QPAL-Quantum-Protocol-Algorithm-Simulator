
// Full client-side state vector simulator for ≤6 qubits
// Matrices represented as flat Float64Array: [re0, im0, re1, im1, ...]

export type Complex = { re: number; im: number }
export type SV = Float64Array  // length = 2 * 2^n

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
  // U = [u00r,u00i, u01r,u01i, u10r,u10i, u11r,u11i]
  const out = new Float64Array(sv.length)
  const dim = 1 << n
  for (let i = 0; i < dim; i++) {
    const bit = (i >> q) & 1
    const j = i ^ (1 << q)   // flip qubit q
    if (bit === 0) {
      const [a0r, a0i] = [sv[2*i], sv[2*i+1]]
      const [a1r, a1i] = [sv[2*j], sv[2*j+1]]
      const [r0r, r0i] = mul(U[0], U[1], a0r, a0i)
      const [r1r, r1i] = mul(U[2], U[3], a1r, a1i)
      const [r2r, r2i] = mul(U[4], U[5], a0r, a0i)
      const [r3r, r3i] = mul(U[6], U[7], a1r, a1i)
      out[2*i]   = r0r + r1r
      out[2*i+1] = r0i + r1i
      out[2*j]   = r2r + r3r
      out[2*j+1] = r2i + r3i
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
        ;[out[2*i], out[2*j]]     = [out[2*j], out[2*i]]
        ;[out[2*i+1], out[2*j+1]] = [out[2*j+1], out[2*i+1]]
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
      out[2*i]   = -out[2*i]
      out[2*i+1] = -out[2*i+1]
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
        ;[out[2*i], out[2*j]]     = [out[2*j], out[2*i]]
        ;[out[2*i+1], out[2*j+1]] = [out[2*j+1], out[2*i+1]]
      }
    }
  }
  return out
}

const S2 = 1 / Math.sqrt(2)
export const UNITARIES: Record<string, readonly number[]> = {
  H:  [S2,0,  S2,0,  S2,0,  -S2,0],
  X:  [0,0,   1,0,   1,0,   0,0],
  Y:  [0,0,   0,-1,  0,1,   0,0],
  Z:  [1,0,   0,0,   0,0,   -1,0],
  S:  [1,0,   0,0,   0,0,   0,1],
  T:  [1,0,   0,0,   0,0,   S2,S2],
  I:  [1,0,   0,0,   0,0,   1,0],
}

export interface StepSnapshot {
  step: number
  gateLabel: string
  sv: SV
  probs: Float64Array
}

export function runCircuit(
  n: number,
  gates: Array<{ gateId: string; qubit: number; step: number; targetQubit?: number }>
): StepSnapshot[] {
  let sv = initZero(n)
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

  for (const [step, stepGates] of [...byStep.entries()].sort((a,b) => a[0]-b[0])) {
    for (const g of stepGates) {
      const id = g.gateId.toUpperCase()
      if (id === 'CNOT' && g.targetQubit !== undefined) {
        sv = applyCNOT(sv, n, g.qubit, g.targetQubit)
      } else if (id === 'CZ' && g.targetQubit !== undefined) {
        sv = applyCZ(sv, n, g.qubit, g.targetQubit)
      } else if (id === 'SWAP' && g.targetQubit !== undefined) {
        sv = applySWAP(sv, n, g.qubit, g.targetQubit)
      } else if (UNITARIES[id]) {
        sv = apply1Q(sv, n, g.qubit, UNITARIES[id])
      }
    }
    snapshots.push({ step, gateLabel: stepGates.map(g=>g.gateId).join(','), sv: sv.slice(), probs: probabilities(sv, n) })
  }

  return snapshots
}

export function probabilities(sv: SV, n: number): Float64Array {
  const dim = 1 << n
  const p = new Float64Array(dim)
  for (let i = 0; i < dim; i++) {
    p[i] = sv[2*i]**2 + sv[2*i+1]**2
  }
  return p
}

export function blochVector(sv: SV, n: number, q: number): { x: number; y: number; z: number } {
  // Compute reduced density matrix of qubit q by partial trace
  const dim = 1 << n
  let r00r = 0, r00i = 0, r01r = 0, r01i = 0, r11r = 0

  for (let i = 0; i < dim; i++) {
    const qi = (i >> q) & 1
    for (let j = 0; j < dim; j++) {
      // Same bits except qubit q
      if ((i ^ j) !== (1 << q) && i !== j) continue
      const qj = (j >> q) & 1
      // Only trace over non-q qubits that match
      const maskI = i & ~(1 << q)
      const maskJ = j & ~(1 << q)
      if (maskI !== maskJ) continue

      const [air, aii] = [sv[2*i], sv[2*i+1]]
      const [ajr, aji] = [sv[2*j], sv[2*j+1]]
      // rho[qi][qj] += alpha_i * conj(alpha_j)
      const contrib_r = air*ajr + aii*aji
      const contrib_i = aii*ajr - air*aji
      if (qi === 0 && qj === 0) { r00r += contrib_r }
      else if (qi === 0 && qj === 1) { r01r += contrib_r; r01i += contrib_i }
      else if (qi === 1 && qj === 1) { r11r += contrib_r }
    }
  }
  // Also add diagonal terms directly
  for (let i = 0; i < dim; i++) {
    const qi = (i >> q) & 1
    const ar = sv[2*i], ai = sv[2*i+1]
    const p = ar*ar + ai*ai
    if (qi === 0) r00r += p
    else r11r += p
  }

  // Bloch vector from density matrix
  return {
    x: 2 * r01r,
    y: -2 * r01i,
    z: r00r - r11r,
  }
}
