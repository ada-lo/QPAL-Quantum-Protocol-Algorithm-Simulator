/**
 * Central preset catalog for tooling, docs, and tests.
 */

import {
  BELL_STATE_PRESET_CODE,
  CUSTOM_ALGORITHM_TEMPLATE,
  CUSTOM_PROTOCOL_TEMPLATE,
} from './bellState.js';
import { BB84_PRESET_CODE } from './bb84.js';
import {
  GHZ_STATE_CODE,
  TELEPORT_ALGORITHM_CODE,
  SUPERDENSE_CODING_CODE,
  DEUTSCH_ALGORITHM_CODE,
  SWAP_TEST_CODE,
} from './advancedAlgorithms.js';
import {
  TELEPORTATION_PROTOCOL_CODE,
  SUPERDENSE_PROTOCOL_CODE,
  E91_PROTOCOL_CODE,
} from './advancedProtocols.js';

export const ALGORITHM_PRESETS = [
  { id: 'bell', icon: 'bell', label: 'Bell State', desc: '|Phi+> entangled pair', code: BELL_STATE_PRESET_CODE, mode: 'algorithm' },
  { id: 'ghz', icon: 'ghz', label: 'GHZ State', desc: '3-qubit entanglement', code: GHZ_STATE_CODE, mode: 'algorithm' },
  { id: 'teleport-algo', icon: 'teleport', label: 'Teleportation', desc: 'Transfer qubit state', code: TELEPORT_ALGORITHM_CODE, mode: 'algorithm' },
  { id: 'superdense', icon: 'superdense', label: 'Superdense Coding', desc: '2 bits via 1 qubit', code: SUPERDENSE_CODING_CODE, mode: 'algorithm' },
  { id: 'deutsch', icon: 'deutsch', label: "Deutsch's Algorithm", desc: 'Constant vs balanced', code: DEUTSCH_ALGORITHM_CODE, mode: 'algorithm' },
  { id: 'swap-test', icon: 'swap', label: 'SWAP Test', desc: 'Test state equality', code: SWAP_TEST_CODE, mode: 'algorithm' },
  { id: 'custom-algo', icon: 'custom', label: 'Custom Algorithm', desc: 'Write your own', code: CUSTOM_ALGORITHM_TEMPLATE, mode: 'algorithm' },
];

export const PROTOCOL_PRESETS = [
  { id: 'bb84', icon: 'bb84', label: 'BB84 Protocol', desc: 'Quantum key distribution', code: BB84_PRESET_CODE, mode: 'protocol', analytics: 'bb84' },
  { id: 'e91', icon: 'e91', label: 'E91 Protocol', desc: 'Entanglement-based QKD', code: E91_PROTOCOL_CODE, mode: 'protocol', analytics: 'e91' },
  { id: 'teleport-proto', icon: 'teleport', label: 'Teleportation', desc: 'Teleport state to Bob', code: TELEPORTATION_PROTOCOL_CODE, mode: 'protocol' },
  { id: 'superdense-proto', icon: 'superdense', label: 'Superdense Coding', desc: '2 bits via 1 qubit', code: SUPERDENSE_PROTOCOL_CODE, mode: 'protocol' },
  { id: 'custom-proto', icon: 'custom', label: 'Custom Protocol', desc: 'Write your own', code: CUSTOM_PROTOCOL_TEMPLATE, mode: 'protocol' },
];

export const PRESET_MAP = new Map([...ALGORITHM_PRESETS, ...PROTOCOL_PRESETS].map((preset) => [preset.id, preset]));

export function getPresetById(id) {
  return PRESET_MAP.get(id) || null;
}
