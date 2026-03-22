export interface LearningStage {
  title: string
  cue: string
}

export interface LearningSceneProfile {
  family: "protocol" | "oracle" | "phase" | "variational" | "walk"
  labels: {
    left: string
    center: string
    right: string
    extra?: string
  }
  stages: LearningStage[]
  legend: { label: string; color: string }[]
}

function protocolProfile(
  labels: LearningSceneProfile["labels"],
  stages: LearningSceneProfile["stages"],
  legend: LearningSceneProfile["legend"],
): LearningSceneProfile {
  return { family: "protocol", labels, stages, legend }
}

function algorithmProfile(
  family: LearningSceneProfile["family"],
  labels: LearningSceneProfile["labels"],
  stages: LearningSceneProfile["stages"],
  legend: LearningSceneProfile["legend"],
): LearningSceneProfile {
  return { family, labels, stages, legend }
}

export const LEARNING_SCENE_PROFILES: Record<string, LearningSceneProfile> = {
  bb84: protocolProfile(
    { left: "Alice", center: "Quantum channel", right: "Bob", extra: "Eve" },
    [
      { title: "Encode a qubit", cue: "The left station prepares a photon in one of two conjugate bases." },
      { title: "Transmit and measure", cue: "The photon crosses the channel while Bob chooses a measurement basis." },
      { title: "Compare bases", cue: "Only matching-basis rounds survive and reveal any disturbance caused by Eve." },
    ],
    [
      { label: "prepared photon", color: "#00d4ff" },
      { label: "measurement basis", color: "#8b5cf6" },
      { label: "classical comparison", color: "#f59e0b" },
    ],
  ),
  e91: protocolProfile(
    { left: "Alice", center: "Entangled source", right: "Bob", extra: "Bell test" },
    [
      { title: "Distribute a Bell pair", cue: "The source emits entangled qubits toward Alice and Bob." },
      { title: "Choose measurement settings", cue: "Different basis settings probe Bell correlations." },
      { title: "Verify correlations", cue: "Non-classical correlations certify security and expose eavesdropping." },
    ],
    [
      { label: "entangled pair", color: "#ab47bc" },
      { label: "measurement setting", color: "#00d4ff" },
      { label: "correlation witness", color: "#22c55e" },
    ],
  ),
  b92: protocolProfile(
    { left: "Alice", center: "Quantum channel", right: "Bob", extra: "Inconclusive" },
    [
      { title: "Choose one of two states", cue: "The sender only needs two non-orthogonal states, which keeps the setup lean." },
      { title: "Probe the incoming state", cue: "Bob applies a measurement that sometimes refuses to answer." },
      { title: "Keep conclusive rounds", cue: "Only the definitive outcomes become sifted key material." },
    ],
    [
      { label: "non-orthogonal state", color: "#26a69a" },
      { label: "measurement probe", color: "#8b5cf6" },
      { label: "kept key bit", color: "#22c55e" },
    ],
  ),
  teleport: protocolProfile(
    { left: "Alice", center: "Bell pair", right: "Bob", extra: "2 classical bits" },
    [
      { title: "Share entanglement", cue: "Alice and Bob begin with a Bell pair while Alice also holds the unknown state." },
      { title: "Bell-basis measurement", cue: "Alice mixes her qubits so the unknown state becomes encoded into two classical bits." },
      { title: "Apply correction", cue: "Bob uses the received bits to reconstruct the original quantum state." },
    ],
    [
      { label: "unknown state", color: "#8b5cf6" },
      { label: "Bell link", color: "#00d4ff" },
      { label: "classical bits", color: "#f59e0b" },
    ],
  ),
  superdense: protocolProfile(
    { left: "Alice", center: "Bell pair", right: "Bob", extra: "2-bit message" },
    [
      { title: "Start with entanglement", cue: "A pre-shared Bell pair is the communication resource." },
      { title: "Encode two bits", cue: "Alice applies one of four local operations to encode a 2-bit message." },
      { title: "Decode both bits", cue: "Bob performs a joint measurement that recovers the whole message." },
    ],
    [
      { label: "Bell resource", color: "#f59e0b" },
      { label: "local encoding", color: "#00d4ff" },
      { label: "decoded message", color: "#22c55e" },
    ],
  ),
  qec: protocolProfile(
    { left: "Logical qubit", center: "Syndrome check", right: "Recovered state", extra: "Physical qubits" },
    [
      { title: "Encode redundancy", cue: "One logical qubit is spread across several physical carriers." },
      { title: "Measure the syndrome", cue: "Ancilla-like checks reveal where an error occurred without reading the state." },
      { title: "Correct the error", cue: "A targeted recovery returns the logical information to the code space." },
    ],
    [
      { label: "logical information", color: "#ff6f00" },
      { label: "syndrome signal", color: "#00d4ff" },
      { label: "recovered state", color: "#22c55e" },
    ],
  ),
  grover: algorithmProfile(
    "oracle",
    { left: "Search register", center: "Oracle", right: "Amplitude readout" },
    [
      { title: "Spread amplitudes", cue: "Hadamards flatten the search space into an even amplitude landscape." },
      { title: "Mark the target", cue: "The oracle flips the phase of the desired basis state only." },
      { title: "Amplify the answer", cue: "Diffusion reflects amplitudes about the mean so the marked state rises above the rest." },
    ],
    [
      { label: "query register", color: "#06b6d4" },
      { label: "phase-marked state", color: "#8b5cf6" },
      { label: "dominant outcome", color: "#22c55e" },
    ],
  ),
  shor: algorithmProfile(
    "phase",
    { left: "Exponent register", center: "Period engine", right: "QFT readout" },
    [
      { title: "Superpose exponents", cue: "Many trial exponents are explored at the same time." },
      { title: "Imprint the period", cue: "Modular arithmetic creates a repeating phase structure." },
      { title: "Decode the period", cue: "Fourier readout turns the phase pattern into a usable period estimate." },
    ],
    [
      { label: "superposition", color: "#ef4444" },
      { label: "periodic phase", color: "#8b5cf6" },
      { label: "frequency peak", color: "#22c55e" },
    ],
  ),
  qft: algorithmProfile(
    "phase",
    { left: "Input basis", center: "Phase ladder", right: "Frequency basis" },
    [
      { title: "Collect phase", cue: "Relative phases accumulate according to input significance." },
      { title: "Interfere coherently", cue: "Phase rotations and Hadamards reorganize the state into frequency components." },
      { title: "Swap into order", cue: "The output register is reordered so the frequency picture reads naturally." },
    ],
    [
      { label: "input amplitudes", color: "#7c3aed" },
      { label: "phase wheel", color: "#00d4ff" },
      { label: "frequency output", color: "#22c55e" },
    ],
  ),
  qaoa: algorithmProfile(
    "variational",
    { left: "Candidate states", center: "Cost graph", right: "Best cut" },
    [
      { title: "Initialize the search", cue: "Every candidate cut starts with comparable amplitude." },
      { title: "Apply cost phase", cue: "The problem Hamiltonian rewards or penalizes configurations through phase." },
      { title: "Mix toward good answers", cue: "Mixer rotations redistribute amplitude toward promising solutions." },
    ],
    [
      { label: "candidate state", color: "#f97316" },
      { label: "cost landscape", color: "#8b5cf6" },
      { label: "best candidate", color: "#22c55e" },
    ],
  ),
  dj: algorithmProfile(
    "oracle",
    { left: "Query register", center: "Oracle", right: "Verdict" },
    [
      { title: "Prepare interference", cue: "The query and ancilla registers are arranged so the oracle can only affect phase." },
      { title: "Query once", cue: "A single coherent oracle call distinguishes balanced from constant behavior." },
      { title: "Read the verdict", cue: "The final interference pattern tells whether the oracle was balanced." },
    ],
    [
      { label: "query state", color: "#14b8a6" },
      { label: "oracle action", color: "#8b5cf6" },
      { label: "binary verdict", color: "#22c55e" },
    ],
  ),
  bv: algorithmProfile(
    "oracle",
    { left: "Query register", center: "Hidden string", right: "Recovered bits" },
    [
      { title: "Prepare the query", cue: "All possible queries are asked in superposition." },
      { title: "Kick back the phase", cue: "The hidden string is encoded into register phases in one oracle call." },
      { title: "Measure the secret", cue: "Interference reveals the full hidden bit string deterministically." },
    ],
    [
      { label: "query qubits", color: "#6366f1" },
      { label: "hidden string", color: "#8b5cf6" },
      { label: "decoded bits", color: "#22c55e" },
    ],
  ),
  simon: algorithmProfile(
    "oracle",
    { left: "Input pair", center: "Collision oracle", right: "Linear constraints" },
    [
      { title: "Prepare equal queries", cue: "The input register spans many candidate values at once." },
      { title: "Create collisions", cue: "The oracle maps paired inputs to the same output according to a hidden xor mask." },
      { title: "Collect equations", cue: "Interference samples linear equations that reveal the secret mask." },
    ],
    [
      { label: "paired inputs", color: "#ea580c" },
      { label: "oracle collision", color: "#8b5cf6" },
      { label: "constraint sample", color: "#22c55e" },
    ],
  ),
  qpe: algorithmProfile(
    "phase",
    { left: "Control register", center: "Eigenphase", right: "Binary estimate" },
    [
      { title: "Prepare controls", cue: "The control register fans out into uniform phase probes." },
      { title: "Accumulate phase", cue: "Controlled powers of the unitary write the eigenphase into relative phase." },
      { title: "Decode the bits", cue: "Inverse QFT turns those phases into a binary estimate." },
    ],
    [
      { label: "control qubits", color: "#a855f7" },
      { label: "phase rotation", color: "#00d4ff" },
      { label: "bit estimate", color: "#22c55e" },
    ],
  ),
  vqe: algorithmProfile(
    "variational",
    { left: "Ansatz", center: "Hamiltonian", right: "Energy minimum" },
    [
      { title: "Prepare a trial state", cue: "The ansatz sets a candidate wavefunction through tunable parameters." },
      { title: "Measure the energy", cue: "Repeated measurements estimate the Hamiltonian expectation value." },
      { title: "Update the parameters", cue: "A classical loop nudges the ansatz toward a lower-energy state." },
    ],
    [
      { label: "ansatz state", color: "#ec4899" },
      { label: "energy probe", color: "#00d4ff" },
      { label: "lower minimum", color: "#22c55e" },
    ],
  ),
  qwalk: algorithmProfile(
    "walk",
    { left: "Coin state", center: "Shift lattice", right: "Position spread" },
    [
      { title: "Toss the quantum coin", cue: "The coin qubit decides how probability can split between directions." },
      { title: "Shift conditionally", cue: "The walker moves left or right depending on the coin state." },
      { title: "Interfere across positions", cue: "Constructive and destructive interference produce the wide quantum spread." },
    ],
    [
      { label: "coin amplitude", color: "#0f766e" },
      { label: "conditional shift", color: "#00d4ff" },
      { label: "position profile", color: "#22c55e" },
    ],
  ),
}

export function getLearningSceneProfile(id: string) {
  return LEARNING_SCENE_PROFILES[id] ?? LEARNING_SCENE_PROFILES.bb84
}
