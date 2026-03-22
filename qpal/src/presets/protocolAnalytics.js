/**
 * Protocol analytics helpers used by the standalone app and tests.
 * These are simplified educational models, not exact physics simulators.
 */

export const EAVESDROP_THRESHOLD = 11;

const BASES = ['Z', 'X'];

function randomBit() {
  return Math.random() < 0.5 ? 0 : 1;
}

function randomBase() {
  return BASES[Math.floor(Math.random() * BASES.length)];
}

function finalizeSecuritySummary(results, keySelector) {
  const matchingMeasurements = results.filter((result) => result.basesMatch);
  const errors = matchingMeasurements.filter((result) => result.error);
  const errorRate = matchingMeasurements.length > 0
    ? Number(((errors.length / matchingMeasurements.length) * 100).toFixed(1))
    : 0;

  return {
    matchingBases: matchingMeasurements.length,
    errors: errors.length,
    errorRate,
    sharedKey: matchingMeasurements.filter((result) => !result.error).map(keySelector),
    eveDetected: errorRate > EAVESDROP_THRESHOLD,
  };
}

export function runBB84Simulation(numBits = 16, eveActive = true) {
  const results = [];

  for (let bit = 0; bit < numBits; bit++) {
    const aliceBasis = randomBase();
    const aliceValue = randomBit();
    const bobBasis = randomBase();

    let transmittedValue = aliceValue;
    let eveBasis = null;

    if (eveActive) {
      eveBasis = randomBase();
      if (eveBasis !== aliceBasis) {
        transmittedValue = randomBit();
      }
    }

    const bobValue = bobBasis === aliceBasis ? transmittedValue : randomBit();
    const basesMatch = aliceBasis === bobBasis;
    const valueMatch = aliceValue === bobValue;

    results.push({
      bit,
      aliceBasis,
      aliceValue,
      eveBasis,
      eveIntercept: eveActive,
      bobBasis,
      bobValue,
      basesMatch,
      valueMatch,
      error: basesMatch && !valueMatch,
    });
  }

  return {
    results,
    ...finalizeSecuritySummary(results, (result) => result.aliceValue),
  };
}

export function runE91Simulation(numPairs = 12, eveActive = true) {
  const results = [];

  for (let pair = 0; pair < numPairs; pair++) {
    const aliceBasis = randomBase();
    const bobBasis = randomBase();
    const entangledValue = randomBit();
    const aliceValue = entangledValue;

    let bobValue = entangledValue;
    let eveBasis = null;

    if (eveActive) {
      eveBasis = randomBase();
      if (eveBasis !== aliceBasis) {
        bobValue = randomBit();
      }
    }

    if (bobBasis !== aliceBasis) {
      bobValue = randomBit();
    }

    const basesMatch = aliceBasis === bobBasis;
    const correlated = aliceValue === bobValue;

    results.push({
      pair,
      aliceBasis,
      aliceValue,
      eveBasis,
      eveIntercept: eveActive,
      bobBasis,
      bobValue,
      basesMatch,
      correlated,
      error: basesMatch && !correlated,
    });
  }

  return {
    results,
    ...finalizeSecuritySummary(results, (result) => result.aliceValue),
  };
}
