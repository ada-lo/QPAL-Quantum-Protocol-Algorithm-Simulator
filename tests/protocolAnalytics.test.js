import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EAVESDROP_THRESHOLD,
  runBB84Simulation,
  runE91Simulation,
} from '../qpal/src/presets/protocolAnalytics.js';

test('BB84 without Eve remains error free on matching bases', () => {
  const simulation = runBB84Simulation(24, false);

  assert.equal(simulation.results.length, 24);
  assert.equal(simulation.errors, 0);
  assert.equal(simulation.eveDetected, false);
  assert.ok(simulation.matchingBases <= simulation.results.length);
});

test('E91 without Eve remains perfectly correlated on matching bases', () => {
  const simulation = runE91Simulation(24, false);

  assert.equal(simulation.results.length, 24);
  assert.equal(simulation.errors, 0);
  assert.equal(simulation.eveDetected, false);
  assert.ok(simulation.sharedKey.length <= simulation.matchingBases);
});

test('protocol analytics expose consistent threshold-based metadata', () => {
  const bb84 = runBB84Simulation(24, true);
  const e91 = runE91Simulation(24, true);

  assert.equal(typeof bb84.errorRate, 'number');
  assert.equal(typeof e91.errorRate, 'number');
  assert.equal(typeof bb84.eveDetected, 'boolean');
  assert.equal(typeof e91.eveDetected, 'boolean');
  assert.equal(EAVESDROP_THRESHOLD, 11);
});
