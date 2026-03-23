import type { LearningExperience } from "@/lib/quantum/learningCatalog"
import { GATES, type GateId } from "@/lib/quantum/gates"
import type { InitialStateId } from "@/lib/quantum/simulator"
import type { CircuitGate } from "@/store/circuitStore"

export interface PseudocodeBlueprint {
  title: string
  goal: string
  lines: string[]
}

export interface CircuitPseudocodeLine {
  line: string
  detail: string
  step: number
  gateIds: GateId[]
}

const EXPERIENCE_BLUEPRINTS: Record<string, PseudocodeBlueprint> = {
  bb84: {
    title: "BB84 protocol",
    goal: "Create a sifted key while detecting eavesdropping through basis mismatch and QBER.",
    lines: [
      "alice_bits, alice_bases <- choose random values",
      "for each round: prepare photon(bit, basis) and send it through the channel",
      "bob_basis <- choose random basis and measure the received state",
      "keep only rounds where alice_basis == bob_basis",
      "estimate qber from a public sample; accept key only if qber is low",
    ],
  },
  e91: {
    title: "E91 protocol",
    goal: "Use entanglement and Bell-test correlations to certify a secure shared key.",
    lines: [
      "create entangled pairs and distribute one qubit to Alice and one to Bob",
      "alice_setting, bob_setting <- choose Bell-test measurement angles",
      "measure both qubits and record correlated outcomes",
      "use a subset of rounds to estimate Bell violation",
      "use compatible rounds to derive the shared key",
    ],
  },
  b92: {
    title: "B92 protocol",
    goal: "Use two non-orthogonal states so only conclusive measurements contribute to the key.",
    lines: [
      "alice_bit <- choose secret bit",
      "prepare either |0> or |+> and send the state to Bob",
      "bob measures with a test that may return inconclusive",
      "discard inconclusive rounds and keep the conclusive detections",
      "compare a public sample to estimate disturbance before finalizing the key",
    ],
  },
  teleport: {
    title: "Quantum teleportation",
    goal: "Transfer an unknown qubit state using entanglement and two classical bits.",
    lines: [
      "prepare the input state |psi> on Alice's qubit",
      "create a Bell pair shared between Alice and Bob",
      "apply Bell-basis operations to Alice's two qubits",
      "measure Alice's qubits to obtain two classical bits",
      "apply X/Z corrections on Bob's qubit using the measured bits",
    ],
  },
  superdense: {
    title: "Superdense coding",
    goal: "Encode two classical bits into one transmitted qubit using a shared Bell pair.",
    lines: [
      "prepare and share a Bell pair between Alice and Bob",
      "alice_bits <- choose the 2-bit message",
      "apply the corresponding local Pauli operation to Alice's qubit",
      "send Alice's qubit to Bob",
      "bob performs Bell-basis decoding and reads both bits",
    ],
  },
  qec: {
    title: "Bit-flip error correction",
    goal: "Protect one logical qubit by spreading it across multiple physical qubits.",
    lines: [
      "encode the logical qubit into a repetition code",
      "let an error channel act on one of the physical qubits",
      "measure syndrome information without collapsing the logical state",
      "infer the faulty qubit from the syndrome pattern",
      "apply the correction to recover the logical information",
    ],
  },
  grover: {
    title: "Grover search",
    goal: "Amplify the marked state so a measurement returns the target with high probability.",
    lines: [
      "prepare a uniform superposition over all basis states",
      "repeat the Grover iteration k times",
      "  oracle(target)     // flip the phase of the target state",
      "  diffusion()        // reflect amplitudes about the average",
      "measure the register and return the most likely state",
    ],
  },
  shor: {
    title: "Shor period finding",
    goal: "Estimate a modular period, then recover factors from that period.",
    lines: [
      "choose a coprime base a for the composite number N",
      "create a superposition of exponents in the control register",
      "apply modular exponentiation to encode periodic structure",
      "apply inverse QFT to the control register",
      "extract the period r and use gcd arithmetic to recover factors",
    ],
  },
  qft: {
    title: "Quantum Fourier transform",
    goal: "Convert phase relationships into a frequency-style basis.",
    lines: [
      "for qubit q from least to most significant",
      "  apply controlled phase rotations from lower-significance qubits",
      "  apply H to convert accumulated phase into amplitude",
      "swap qubits to reverse bit order",
      "read the transformed register",
    ],
  },
  qaoa: {
    title: "QAOA loop",
    goal: "Alternate cost and mixer layers to search for a good combinatorial solution.",
    lines: [
      "prepare a uniform superposition over candidate solutions",
      "for layer in 1..p",
      "  apply cost Hamiltonian using gamma[layer]",
      "  apply mixer Hamiltonian using beta[layer]",
      "measure candidates and classically update parameters",
    ],
  },
  dj: {
    title: "Deutsch-Jozsa algorithm",
    goal: "Decide whether an oracle is constant or balanced with one coherent query.",
    lines: [
      "prepare query qubits in |+> and ancilla in |->",
      "query the oracle once in superposition",
      "apply H to the query register again",
      "if all query bits measure 0 then oracle is constant",
      "otherwise the oracle is balanced",
    ],
  },
  bv: {
    title: "Bernstein-Vazirani algorithm",
    goal: "Recover the hidden bit string with one oracle call.",
    lines: [
      "prepare query qubits in |+> and the ancilla in |->",
      "apply the hidden-string oracle once",
      "phase kickback writes the secret into the query phases",
      "apply H to the query register",
      "measure the query bits to read the hidden string directly",
    ],
  },
  simon: {
    title: "Simon's algorithm",
    goal: "Learn the hidden xor mask by collecting interference constraints.",
    lines: [
      "prepare the input register in superposition",
      "query the two-to-one oracle and entangle input with output",
      "measure the output register to collapse onto a paired input state",
      "apply H to the input register and measure a linear constraint",
      "repeat until the hidden xor mask can be solved classically",
    ],
  },
  qpe: {
    title: "Quantum phase estimation",
    goal: "Estimate the eigenphase of a unitary using controlled powers and inverse QFT.",
    lines: [
      "prepare control qubits in |+> and target qubit in an eigenstate",
      "apply controlled-U^(2^k) operations from each control qubit",
      "the control register accumulates the eigenphase in relative phase",
      "apply inverse QFT to the control register",
      "measure control bits to obtain the binary phase estimate",
    ],
  },
  vqe: {
    title: "Variational quantum eigensolver",
    goal: "Optimize a parameterized ansatz to minimize energy.",
    lines: [
      "choose ansatz parameters theta",
      "prepare the trial state |psi(theta)>",
      "measure expectation values of the Hamiltonian terms",
      "compute the total energy classically",
      "update theta and repeat until convergence",
    ],
  },
  qwalk: {
    title: "Discrete quantum walk",
    goal: "Use a coin and conditional shift to spread amplitude across positions.",
    lines: [
      "initialize the walker at a starting position and set the coin state",
      "for each time step",
      "  apply the coin operator",
      "  shift left or right conditioned on the coin state",
      "measure position probabilities to observe interference-driven spread",
    ],
  },
}

function formatInitialState(state: InitialStateId, qubit: number) {
  return `q${qubit} <- ${state}`
}

function gateTargetLabel(gate: CircuitGate) {
  return gate.targetQubit !== undefined ? `q${gate.targetQubit}` : ""
}

export function describeGate(gate: CircuitGate) {
  const def = GATES[gate.gateId]
  const angleText = gate.angle !== undefined ? `(${(gate.angle / Math.PI).toFixed(2)}pi)` : ""

  if (gate.gateId === "CNOT" || gate.gateId === "CZ" || gate.gateId === "SWAP") {
    return `${gate.gateId.toLowerCase()} q${gate.qubit}, ${gateTargetLabel(gate)}`
  }

  if (gate.gateId === "TOFFOLI") {
    const control = gate.controlQubit !== undefined ? `q${gate.controlQubit}` : "q?"
    return `toffoli q${gate.qubit}, ${control}, ${gateTargetLabel(gate)}`
  }

  if (def?.isDisplay) {
    return `show ${gate.gateId.toLowerCase()} on q${gate.qubit}`
  }

  if (gate.gateId === "MEASURE") {
    return `measure q${gate.qubit}`
  }

  return `${gate.gateId.toLowerCase()}${angleText} q${gate.qubit}`
}

function gateDetail(gate: CircuitGate) {
  const def = GATES[gate.gateId]
  if (!def) return "Applies a circuit operation."
  if (gate.gateId === "CNOT") return "Use the control qubit to flip the target qubit only when the control is |1>."
  if (gate.gateId === "CZ") return "Imprint a conditional phase without changing the measured bit values directly."
  if (gate.gateId === "SWAP") return "Exchange the quantum states stored in the two qubits."
  if (gate.gateId === "TOFFOLI") return "A doubly controlled NOT often used in reversible logic and oracle construction."
  if (gate.gateId === "MEASURE") return "Collapse the qubit into a classical outcome in the computational basis."
  if (def.isDisplay) return def.description
  return def.description
}

export function buildCircuitPseudocode(
  nQubits: number,
  initialStates: InitialStateId[],
  gates: CircuitGate[],
): CircuitPseudocodeLine[] {
  const lines: CircuitPseudocodeLine[] = [
    {
      step: -1,
      gateIds: [],
      line: `allocate q[0..${Math.max(nQubits - 1, 0)}]`,
      detail: initialStates.map((state, qubit) => formatInitialState(state, qubit)).join(" | "),
    },
  ]

  const grouped = new Map<number, CircuitGate[]>()
  for (const gate of gates) {
    if (!grouped.has(gate.step)) grouped.set(gate.step, [])
    grouped.get(gate.step)!.push(gate)
  }

  for (const step of [...grouped.keys()].sort((a, b) => a - b)) {
    const stepGates = grouped.get(step) ?? []
    lines.push({
      step,
      gateIds: stepGates.map((gate) => gate.gateId),
      line: `step ${step + 1}: ${stepGates.map(describeGate).join("; ")}`,
      detail: stepGates.map((gate) => gateDetail(gate)).join(" "),
    })
  }

  if (gates.some((gate) => gate.gateId === "MEASURE")) {
    lines.push({
      step: gates.length + 1,
      gateIds: ["MEASURE"],
      line: "return measurement statistics",
      detail: "Read the final computational-basis distribution or state-vector probabilities.",
    })
  } else {
    lines.push({
      step: gates.length + 1,
      gateIds: [],
      line: "inspect state vector and single-qubit Bloch data",
      detail: "Use the output, Bloch, and probability panels to interpret the resulting quantum state.",
    })
  }

  return lines
}

export function getExperienceBlueprint(experience: LearningExperience): PseudocodeBlueprint {
  return EXPERIENCE_BLUEPRINTS[experience.id] ?? {
    title: experience.label,
    goal: experience.summary,
    lines: experience.story.map((line, index) => `${index + 1}. ${line}`),
  }
}
