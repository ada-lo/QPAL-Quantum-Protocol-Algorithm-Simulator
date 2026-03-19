// Quantum gate definitions — unitary matrices as flat arrays [re00,im00, re01,im01, re10,im10, re11,im11]
export type GateId = 'H'|'X'|'Y'|'Z'|'S'|'T'|'CNOT'|'SWAP'|'CZ'|'TOFFOLI'|'MEASURE'

export interface GateDef {
  id: GateId
  label: string
  color: string
  qubits: number  // 1 | 2 | 3
  description: string
}

export const GATES: Record<GateId, GateDef> = {
  H:       { id:'H',       label:'H',    color:'var(--gate-h)',     qubits:1, description:'Hadamard — creates superposition' },
  X:       { id:'X',       label:'X',    color:'var(--gate-x)',     qubits:1, description:'Pauli-X — quantum NOT gate' },
  Y:       { id:'Y',       label:'Y',    color:'var(--gate-y)',     qubits:1, description:'Pauli-Y gate' },
  Z:       { id:'Z',       label:'Z',    color:'var(--gate-z)',     qubits:1, description:'Pauli-Z — phase flip' },
  S:       { id:'S',       label:'S',    color:'var(--gate-s)',     qubits:1, description:'S gate — 90° phase' },
  T:       { id:'T',       label:'T',    color:'var(--gate-t)',     qubits:1, description:'T gate — 45° phase' },
  CNOT:    { id:'CNOT',    label:'CNOT', color:'var(--gate-cnot)',  qubits:2, description:'Controlled-NOT — creates entanglement' },
  SWAP:    { id:'SWAP',    label:'SWAP', color:'var(--gate-cnot)',  qubits:2, description:'Swap two qubits' },
  CZ:      { id:'CZ',      label:'CZ',   color:'var(--gate-z)',     qubits:2, description:'Controlled-Z gate' },
  TOFFOLI: { id:'TOFFOLI', label:'TOF',  color:'var(--accent-pink)',qubits:3, description:'Toffoli — CCNOT gate' },
  MEASURE: { id:'MEASURE', label:'M',    color:'var(--gate-measure)',qubits:1, description:'Measurement in Z basis' },
}

export const SINGLE_QUBIT_GATES: GateId[] = ['H','X','Y','Z','S','T']
export const TWO_QUBIT_GATES: GateId[] = ['CNOT','SWAP','CZ']
export const THREE_QUBIT_GATES: GateId[] = ['TOFFOLI']
