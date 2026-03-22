/**
 * Bell State Preset
 * Creates a maximally entangled two-qubit state |Φ+⟩
 */

export const BELL_STATE_PRESET_CODE = `# ══════════════════════════════════════
# Bell State: |Φ+⟩ = (|00⟩ + |11⟩) / √2
# ══════════════════════════════════════

# Step 1: Initialize two qubits to |0⟩
INIT q0
INIT q1

# Step 2: Apply Hadamard to q0 → superposition
# q0 is now |+⟩ = (|0⟩ + |1⟩) / √2
H q0

# Step 3: CNOT with q0 as control, q1 as target
# This entangles q0 and q1
# Result: (|00⟩ + |11⟩) / √2
CNOT q0 q1

# Step 4: Measure both qubits
# They will ALWAYS agree (correlation)
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z`;

export const BELL_STATE_DESCRIPTION = `
A Bell State is a maximally entangled quantum state of two qubits.

**The |Φ+⟩ Bell State:**
- Start with |00⟩
- Apply H to q0 → (|0⟩ + |1⟩)/√2 ⊗ |0⟩
- Apply CNOT → (|00⟩ + |11⟩)/√2

**Key properties:**
- Measuring q0 instantly determines q1's value
- Results are perfectly correlated
- Each measurement gives 0 or 1 with 50% probability

This is the foundation of quantum teleportation and superdense coding.
`;

export const CUSTOM_ALGORITHM_TEMPLATE = `# Custom Algorithm Template
# Available commands:
# INIT <qubit>         - Initialize qubit to |0⟩
# H <qubit>           - Hadamard (superposition)
# X <qubit>           - Pauli-X (NOT gate)
# CNOT <ctrl> <tgt>   - Controlled-NOT (entangle)
# MEASURE <qubit> [BASIS X|Z]

INIT q0
INIT q1
H q0
CNOT q0 q1
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z`;

export const CUSTOM_PROTOCOL_TEMPLATE = `# Custom Protocol Template
# Available commands:
# ACTOR <name>         - Declare a protocol participant
# ASSIGN <qubit> <actor>  - Give qubit to actor
# SEND <qubit> <from> <to> - Transmit qubit
# INTERCEPT <qubit> <who>  - Intercept transmission
# Plus all algorithm commands above

ACTOR Alice
ACTOR Bob
ACTOR Eve

INIT q0
H q0
ASSIGN q0 Alice

# Optionally add: INTERCEPT q0 Eve

SEND q0 Alice Bob
MEASURE q0 BASIS Z`;
