/**
 * BB84 Quantum Key Distribution Preset
 * Simulates the BB84 protocol with Alice, Bob, and optional Eve
 */

import { runBB84Simulation } from './protocolAnalytics.js';

export const BB84_PRESET_CODE = `# ══════════════════════════════════
# BB84 Quantum Key Distribution
# Alice sends, Eve may intercept, Bob measures
# ══════════════════════════════════

# Step 1: Declare actors
ACTOR Alice
ACTOR Bob
ACTOR Eve

# Step 2: Alice prepares qubit q0 in superposition
INIT q0
H q0
ASSIGN q0 Alice

# Step 3: Alice prepares qubit q1 in |1⟩ state
INIT q1
X q1
ASSIGN q1 Alice

# Step 4: Alice sends q0 to Bob (Eve intercepts!)
INTERCEPT q0 Eve
SEND q0 Alice Bob

# Step 5: Alice sends q1 to Bob directly
SEND q1 Alice Bob

# Step 6: Bob measures in Z basis
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z

# Step 7: Bob measures in X basis (to detect errors)
INIT q2
H q2
ASSIGN q2 Alice
SEND q2 Alice Bob
MEASURE q2 BASIS X`;

export const BB84_DESCRIPTION = `
BB84 is the first quantum key distribution protocol (Bennett & Brassard, 1984).

**How it works:**
1. Alice prepares qubits in random bases (Z or X)
2. Alice sends qubits to Bob over a quantum channel
3. Bob measures in randomly chosen bases
4. Alice and Bob publicly compare bases (not values)
5. Matching bases → shared secret key bits

**Eve's attack:**
When Eve intercepts, she must guess the basis to measure in.
A wrong basis choice collapses the qubit incorrectly,
introducing ~25% errors that Alice and Bob can detect.

**Security guarantee:**
If error rate > ~11%, assume eavesdropping → abort.
`;

export { runBB84Simulation };
