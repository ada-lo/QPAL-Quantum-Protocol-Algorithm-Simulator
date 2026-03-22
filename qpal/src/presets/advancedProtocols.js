/**
 * Additional communication protocol presets mirrored from the standalone app.
 */

export const TELEPORTATION_PROTOCOL_CODE = `# ══════════════════════════════════
# Quantum Teleportation Protocol
# Alice teleports |psi> to Bob
# ══════════════════════════════════

# Declare actors
ACTOR Alice
ACTOR Bob

# Alice prepares the qubit to teleport
INIT q0
X q0
ASSIGN q0 Alice

# Shared Bell pair
INIT q1
INIT q2
H q1
CNOT q1 q2
ASSIGN q1 Alice
ASSIGN q2 Bob

# Alice performs Bell measurement
CNOT q0 q1
H q0
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z

# Alice sends classical results to Bob
SEND q0 Alice Bob
SEND q1 Alice Bob

# Bob applies corrections and measures
X q2
MEASURE q2 BASIS Z`;

export const TELEPORTATION_PROTOCOL_DESCRIPTION = `
A protocol-oriented teleportation walkthrough that separates Alice's actions,
classical communication, and Bob's recovery step.
`;

export const SUPERDENSE_PROTOCOL_CODE = `# ══════════════════════════════════
# Superdense Coding Protocol
# Alice sends 2 bits to Bob via 1 qubit
# ══════════════════════════════════

# Declare actors
ACTOR Alice
ACTOR Bob

# Shared entangled pair
INIT q0
INIT q1
H q0
CNOT q0 q1
ASSIGN q0 Alice
ASSIGN q1 Bob

# Alice encodes two classical bits
# Encoding "01" -> apply X gate
X q0

# Alice sends her qubit to Bob
SEND q0 Alice Bob

# Bob decodes
CNOT q0 q1
H q0
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z`;

export const SUPERDENSE_PROTOCOL_DESCRIPTION = `
This protocol preset frames superdense coding as a sender/receiver communication flow.
`;

export const E91_PROTOCOL_CODE = `# ══════════════════════════════════
# E91 Protocol (Ekert 1991)
# Entanglement-based QKD
# ══════════════════════════════════

# Declare actors
ACTOR Alice
ACTOR Bob
ACTOR Eve

# Source creates entangled pairs
# Pair 1
INIT q0
INIT q1
H q0
CNOT q0 q1
ASSIGN q0 Alice
ASSIGN q1 Bob

# Pair 2
INIT q2
INIT q3
H q2
CNOT q2 q3
ASSIGN q2 Alice
ASSIGN q3 Bob

# Pair 3 - Eve intercepts this one
INIT q4
INIT q5
H q4
CNOT q4 q5
ASSIGN q4 Alice
ASSIGN q5 Bob
INTERCEPT q5 Eve

# Alice and Bob measure in random bases
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z
MEASURE q2 BASIS X
MEASURE q3 BASIS X
MEASURE q4 BASIS Z
MEASURE q5 BASIS X`;

export const E91_PROTOCOL_DESCRIPTION = `
E91 shows entanglement-based key distribution and how channel disturbance breaks
expected correlation between remote measurements.
`;
