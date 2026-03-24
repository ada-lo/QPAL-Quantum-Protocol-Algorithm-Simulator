/**
 * qcEngine.ts — Higher-level quantum simulation adapter wrapping the
 * `quantum-circuit` npm package for extended gate sets and QASM export.
 *
 * This complements QPAL's existing `simulator.ts` (fast, custom Float64Array)
 * with features like:
 *   - OpenQASM import/export
 *   - Extended gate library (50+ gates vs ~15 in simulator.ts)
 *   - Density matrix output for mixed states
 *   - >16 qubit support (at the cost of speed)
 *
 * Usage:
 *   import { QCEngine } from './qcEngine'
 *   const engine = new QCEngine(4)
 *   engine.h(0); engine.cx(0, 1)
 *   const sv = engine.statevector()
 *   const qasm = engine.toQASM()
 */

// @ts-expect-error — quantum-circuit doesn't ship type declarations
import QuantumCircuit from 'quantum-circuit'

export interface QCStatevector {
  /** Interleaved [re, im, re, im, ...] like simulator.ts */
  amplitudes: Float64Array
  /** Per-basis-state probabilities */
  probabilities: Float64Array
  /** Number of qubits */
  nQubits: number
}

export class QCEngine {
  private circuit: InstanceType<typeof QuantumCircuit>
  private nQubits: number

  constructor(nQubits: number) {
    this.nQubits = nQubits
    this.circuit = new QuantumCircuit(nQubits)
  }

  // ── 1-qubit gates ────────────────────────────────────────────────────

  h(qubit: number, column?: number): this {
    this.circuit.addGate('h', column ?? -1, qubit)
    return this
  }

  x(qubit: number, column?: number): this {
    this.circuit.addGate('x', column ?? -1, qubit)
    return this
  }

  y(qubit: number, column?: number): this {
    this.circuit.addGate('y', column ?? -1, qubit)
    return this
  }

  z(qubit: number, column?: number): this {
    this.circuit.addGate('z', column ?? -1, qubit)
    return this
  }

  s(qubit: number, column?: number): this {
    this.circuit.addGate('s', column ?? -1, qubit)
    return this
  }

  t(qubit: number, column?: number): this {
    this.circuit.addGate('t', column ?? -1, qubit)
    return this
  }

  rx(qubit: number, theta: number, column?: number): this {
    this.circuit.addGate('rx', column ?? -1, qubit, { params: { theta } })
    return this
  }

  ry(qubit: number, theta: number, column?: number): this {
    this.circuit.addGate('ry', column ?? -1, qubit, { params: { theta } })
    return this
  }

  rz(qubit: number, theta: number, column?: number): this {
    this.circuit.addGate('rz', column ?? -1, qubit, { params: { phi: theta } })
    return this
  }

  // ── 2-qubit gates ────────────────────────────────────────────────────

  cx(control: number, target: number, column?: number): this {
    this.circuit.addGate('cx', column ?? -1, [control, target])
    return this
  }

  cz(control: number, target: number, column?: number): this {
    this.circuit.addGate('cz', column ?? -1, [control, target])
    return this
  }

  swap(a: number, b: number, column?: number): this {
    this.circuit.addGate('swap', column ?? -1, [a, b])
    return this
  }

  // ── 3-qubit gates ────────────────────────────────────────────────────

  ccx(c1: number, c2: number, target: number, column?: number): this {
    this.circuit.addGate('ccx', column ?? -1, [c1, c2, target])
    return this
  }

  // ── Measurement ──────────────────────────────────────────────────────

  measure(qubit: number, column?: number): this {
    this.circuit.addGate('measure', column ?? -1, qubit)
    return this
  }

  // ── Execution ────────────────────────────────────────────────────────

  /** Run the circuit and return the statevector in simulator.ts-compatible format */
  statevector(): QCStatevector {
    this.circuit.run()
    const dim = 1 << this.nQubits
    const amplitudes = new Float64Array(2 * dim)
    const probabilities = new Float64Array(dim)

    for (let i = 0; i < dim; i++) {
      const state = this.circuit.state(i) || [0, 0]
      const re = typeof state === 'object' && 're' in state ? state.re : (Array.isArray(state) ? state[0] : 0)
      const im = typeof state === 'object' && 'im' in state ? state.im : (Array.isArray(state) ? state[1] : 0)
      amplitudes[2 * i] = re
      amplitudes[2 * i + 1] = im
      probabilities[i] = re * re + im * im
    }

    return { amplitudes, probabilities, nQubits: this.nQubits }
  }

  // ── Export ────────────────────────────────────────────────────────────

  /** Export the circuit as OpenQASM 2.0 string */
  toQASM(): string {
    return this.circuit.exportQASM()
  }

  /** Export the circuit as Quil string */
  toQuil(): string {
    return this.circuit.exportQuil()
  }

  /** Get the circuit's gate count */
  get gateCount(): number {
    return this.circuit.numGates()
  }

  /** Get the circuit's depth */
  get depth(): number {
    return this.circuit.numCols()
  }

  /** Reset circuit to empty state */
  reset(): void {
    this.circuit = new QuantumCircuit(this.nQubits)
  }
}
