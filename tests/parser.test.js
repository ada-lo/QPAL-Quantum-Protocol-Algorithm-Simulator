import test from 'node:test';
import assert from 'node:assert/strict';

import { parseProgram } from '../qpal/src/parser/parser.js';

test('parser trims hash comments cleanly', () => {
  const { instructions, valid } = parseProgram('# Bell state walkthrough');

  assert.equal(valid, true);
  assert.equal(instructions[0].type, 'COMMENT');
  assert.equal(instructions[0].text, 'Bell state walkthrough');
});

test('parser trims double-slash comments without leaving a leading slash', () => {
  const { instructions, valid } = parseProgram('// protocol note');

  assert.equal(valid, true);
  assert.equal(instructions[0].type, 'COMMENT');
  assert.equal(instructions[0].text, 'protocol note');
});

test('parser handles mixed algorithm and protocol instructions', () => {
  const { instructions, errors, valid } = parseProgram(`ACTOR Alice
INIT q0
H q0
ASSIGN q0 Alice
SEND q0 Alice Bob
MEASURE q0 BASIS X`);

  assert.equal(valid, true);
  assert.equal(errors.length, 0);
  assert.deepEqual(
    instructions.filter((instruction) => instruction.type !== 'COMMENT').map((instruction) => instruction.type),
    ['ACTOR', 'INIT', 'H', 'ASSIGN', 'SEND', 'MEASURE']
  );
});
