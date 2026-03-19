// Client-side lightweight state vector (up to 6 qubits for preview animations)
// Heavier simulation is offloaded to the FastAPI backend

export type Complex = { re: number; im: number }
export type StateVector = Complex[]

export function zeroState(nQubits: number): StateVector {
  const dim = 1 << nQubits
  return Array.from({ length: dim }, (_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }))
}

export function amplitude(sv: StateVector, idx: number): number {
  const c = sv[idx]
  return Math.sqrt(c.re * c.re + c.im * c.im)
}

export function probability(sv: StateVector, idx: number): number {
  return amplitude(sv, idx) ** 2
}

export function phase(sv: StateVector, idx: number): number {
  return Math.atan2(sv[idx].im, sv[idx].re)
}

export function blochAngles(sv: StateVector): { theta: number; phi: number } {
  // Only valid for single-qubit state
  const alpha = sv[0]
  const beta  = sv[1]
  const r = Math.sqrt(alpha.re**2 + alpha.im**2)
  const theta = 2 * Math.acos(Math.min(1, r))
  const phi = Math.atan2(beta.im, beta.re) - Math.atan2(alpha.im, alpha.re)
  return { theta, phi }
}

export function formatBasisState(idx: number, nQubits: number): string {
  return "|" + idx.toString(2).padStart(nQubits, "0") + "⟩"
}
