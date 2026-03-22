import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ALGORITHM_PRESETS,
  PROTOCOL_PRESETS,
  getPresetById,
} from '../qpal/src/presets/catalog.js';

test('algorithm catalog includes advanced presets', () => {
  assert.ok(ALGORITHM_PRESETS.length >= 7);
  assert.equal(getPresetById('ghz')?.label, 'GHZ State');
  assert.equal(getPresetById('deutsch')?.label, "Deutsch's Algorithm");
  assert.equal(getPresetById('swap-test')?.label, 'SWAP Test');
});

test('protocol catalog includes analytics-ready secure communication presets', () => {
  assert.equal(getPresetById('bb84')?.analytics, 'bb84');
  assert.equal(getPresetById('e91')?.analytics, 'e91');
  assert.equal(PROTOCOL_PRESETS.some((preset) => preset.id === 'teleport-proto'), true);
  assert.equal(PROTOCOL_PRESETS.some((preset) => preset.id === 'superdense-proto'), true);
});
