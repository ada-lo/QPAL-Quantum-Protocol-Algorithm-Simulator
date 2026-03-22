/**
 * BB84 Quantum Key Distribution Preset
 * Simulates the BB84 protocol with Alice, Bob, and optional Eve
 */

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

/**
 * Run a full BB84 simulation programmatically
 * Returns statistics about the exchange
 */
export function runBB84Simulation(numBits = 10, eveActive = true) {
  const bases = ['Z', 'X'];
  const results = [];

  for (let i = 0; i < numBits; i++) {
    const aliceBasis = bases[Math.floor(Math.random() * 2)];
    const aliceValue = Math.random() < 0.5 ? 0 : 1;
    const bobBasis = bases[Math.floor(Math.random() * 2)];

    let transmittedValue = aliceValue;
    let eveDetected = false;
    let eveBasis = null;

    // Eve intercepts
    if (eveActive) {
      eveBasis = bases[Math.floor(Math.random() * 2)];
      if (eveBasis !== aliceBasis) {
        // Wrong basis: Eve gets random result, re-prepares incorrectly
        transmittedValue = Math.random() < 0.5 ? 0 : 1;
        eveDetected = true; // potentially detectable
      }
    }

    // Bob measures
    let bobValue;
    if (bobBasis === aliceBasis) {
      // Same basis as Alice: should get correct result
      // But if Eve disturbed it, might be wrong
      bobValue = transmittedValue;
    } else {
      // Different basis: random result
      bobValue = Math.random() < 0.5 ? 0 : 1;
    }

    const basesMatch = aliceBasis === bobBasis;
    const valueMatch = aliceValue === bobValue;

    results.push({
      bit: i,
      aliceBasis,
      aliceValue,
      eveBasis: eveActive ? eveBasis : null,
      eveIntercept: eveActive,
      bobBasis,
      bobValue,
      basesMatch,
      valueMatch,
      error: basesMatch && !valueMatch,
    });
  }

  const matchingBases = results.filter(r => r.basesMatch);
  const errors = matchingBases.filter(r => r.error);
  const errorRate = matchingBases.length > 0
    ? ((errors.length / matchingBases.length) * 100).toFixed(1)
    : '0.0';

  const sharedKey = matchingBases
    .filter(r => !r.error)
    .map(r => r.aliceValue);

  return {
    results,
    matchingBases: matchingBases.length,
    errors: errors.length,
    errorRate: parseFloat(errorRate),
    sharedKey,
    eveDetected: parseFloat(errorRate) > 11,
  };
}
