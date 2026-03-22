/**
 * Additional algorithm presets mirrored from the standalone app.
 */

export const GHZ_STATE_CODE = `# ══════════════════════════════════
# GHZ State: (|000⟩ + |111⟩) / √2
# Greenberger-Zeilinger-Horne
# ══════════════════════════════════

# Initialize three qubits
INIT q0
INIT q1
INIT q2

# Hadamard on q0 -> superposition
H q0

# Cascade CNOT to entangle all three
CNOT q0 q1
CNOT q0 q2

# Measure all - they always agree
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z
MEASURE q2 BASIS Z`;

export const GHZ_STATE_DESCRIPTION = `
A GHZ state extends Bell-pair style entanglement to three qubits.
It is useful for demonstrating multi-party correlation and global entanglement.
`;

export const TELEPORT_ALGORITHM_CODE = `# ══════════════════════════════════
# Quantum Teleportation (Circuit)
# Transfer |psi> from q0 -> q2
# ══════════════════════════════════

# Prepare the qubit to teleport
INIT q0
X q0

# Create Bell pair between q1 and q2
INIT q1
INIT q2
H q1
CNOT q1 q2

# Bell measurement on q0, q1
CNOT q0 q1
H q0
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z

# Correction gates on q2
# (In a real circuit these are conditional)
X q2

# Verify teleported state
MEASURE q2 BASIS Z`;

export const TELEPORT_ALGORITHM_DESCRIPTION = `
An educational teleportation walkthrough showing Bell-pair preparation,
Bell measurement, and a simplified correction stage.
`;

export const SUPERDENSE_CODING_CODE = `# ══════════════════════════════════
# Superdense Coding (Circuit)
# Send 2 classical bits via 1 qubit
# ══════════════════════════════════

# Create entangled Bell pair
INIT q0
INIT q1
H q0
CNOT q0 q1

# Encode 2 classical bits on q0
# Encoding "11" -> apply X then Z (X here)
X q0

# Decode: reverse the Bell circuit
CNOT q0 q1
H q0

# Measure to retrieve encoded bits
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z`;

export const SUPERDENSE_CODING_DESCRIPTION = `
Superdense coding demonstrates how entanglement lets one transmitted qubit
carry two classical bits of information.
`;

export const DEUTSCH_ALGORITHM_CODE = `# ══════════════════════════════════
# Deutsch's Algorithm
# Determines if f is constant or balanced
# using only ONE function evaluation
# ══════════════════════════════════

# Initialize input and output qubits
INIT q0
INIT q1

# Prepare output qubit in |1>
X q1

# Apply Hadamard to both
H q0
H q1

# Oracle: CNOT acts as balanced f(x) = x
CNOT q0 q1

# Apply Hadamard to input
H q0

# Measure input qubit
# |0> -> f is constant, |1> -> f is balanced
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z`;

export const DEUTSCH_ALGORITHM_DESCRIPTION = `
Deutsch's algorithm is a compact early quantum speedup example that classifies
an oracle as constant or balanced with one effective query.
`;

export const SWAP_TEST_CODE = `# ══════════════════════════════════
# SWAP Test
# Tests equality of two quantum states
# ══════════════════════════════════

# Ancilla qubit
INIT q0
# State A
INIT q1
# State B
INIT q2

# Prepare identical states for testing
H q1
H q2

# Hadamard on ancilla
H q0

# Controlled-SWAP via CNOT decomposition
CNOT q1 q2
CNOT q0 q1
CNOT q1 q2

# Hadamard on ancilla
H q0

# Measure ancilla: |0> = states are equal
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z
MEASURE q2 BASIS Z`;

export const SWAP_TEST_DESCRIPTION = `
The SWAP test is a comparison routine that estimates whether two states are equal.
`;
