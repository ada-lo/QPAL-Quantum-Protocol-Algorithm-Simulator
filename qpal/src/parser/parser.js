/**
 * QPAL Pseudo-Language Parser
 * Converts pseudo-code text → structured instruction objects
 */

const VALID_COMMANDS = new Set([
  'INIT', 'H', 'X', 'CNOT', 'MEASURE',
  'ACTOR', 'ASSIGN', 'SEND', 'INTERCEPT', 'COMMENT'
]);

const BASIS_OPTIONS = new Set(['X', 'Z']);

/**
 * Parse a single line into an instruction object
 */
function parseLine(line, lineNumber) {
  const trimmed = line.trim();

  // Skip empty lines
  if (!trimmed) return null;

  // Handle comments
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    const text = trimmed.startsWith('//') ? trimmed.slice(2).trim() : trimmed.slice(1).trim();
    return { type: 'COMMENT', text, lineNumber };
  }

  const tokens = trimmed.split(/\s+/);
  const command = tokens[0].toUpperCase();

  if (!VALID_COMMANDS.has(command)) {
    return {
      type: 'ERROR',
      lineNumber,
      raw: trimmed,
      message: `Unknown command: "${tokens[0]}". Valid commands: ${[...VALID_COMMANDS].filter(c => c !== 'COMMENT').join(', ')}`
    };
  }

  switch (command) {
    case 'INIT': {
      if (tokens.length < 2) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'INIT requires a qubit name. Example: INIT q0' };
      }
      return { type: 'INIT', qubit: tokens[1].toLowerCase(), lineNumber, raw: trimmed };
    }

    case 'H': {
      if (tokens.length < 2) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'H (Hadamard) requires a qubit name. Example: H q0' };
      }
      return { type: 'H', qubit: tokens[1].toLowerCase(), lineNumber, raw: trimmed };
    }

    case 'X': {
      if (tokens.length < 2) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'X (Pauli-X / NOT gate) requires a qubit name. Example: X q0' };
      }
      return { type: 'X', qubit: tokens[1].toLowerCase(), lineNumber, raw: trimmed };
    }

    case 'CNOT': {
      if (tokens.length < 3) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'CNOT requires control and target qubits. Example: CNOT q0 q1' };
      }
      return {
        type: 'CNOT',
        control: tokens[1].toLowerCase(),
        target: tokens[2].toLowerCase(),
        lineNumber,
        raw: trimmed
      };
    }

    case 'MEASURE': {
      if (tokens.length < 2) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'MEASURE requires a qubit name. Example: MEASURE q0 or MEASURE q0 BASIS Z' };
      }
      let basis = 'Z'; // default basis
      if (tokens.length >= 4 && tokens[2].toUpperCase() === 'BASIS') {
        const basisArg = tokens[3].toUpperCase();
        if (!BASIS_OPTIONS.has(basisArg)) {
          return { type: 'ERROR', lineNumber, raw: trimmed, message: `Invalid basis "${tokens[3]}". Must be X or Z.` };
        }
        basis = basisArg;
      }
      return { type: 'MEASURE', qubit: tokens[1].toLowerCase(), basis, lineNumber, raw: trimmed };
    }

    case 'ACTOR': {
      if (tokens.length < 2) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'ACTOR requires a name. Example: ACTOR Alice' };
      }
      return { type: 'ACTOR', name: tokens[1], lineNumber, raw: trimmed };
    }

    case 'ASSIGN': {
      if (tokens.length < 3) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'ASSIGN requires qubit and actor. Example: ASSIGN q0 Alice' };
      }
      return { type: 'ASSIGN', qubit: tokens[1].toLowerCase(), actor: tokens[2], lineNumber, raw: trimmed };
    }

    case 'SEND': {
      if (tokens.length < 4) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'SEND requires qubit, sender and receiver. Example: SEND q0 Alice Bob' };
      }
      return {
        type: 'SEND',
        qubit: tokens[1].toLowerCase(),
        from: tokens[2],
        to: tokens[3],
        lineNumber,
        raw: trimmed
      };
    }

    case 'INTERCEPT': {
      if (tokens.length < 3) {
        return { type: 'ERROR', lineNumber, raw: trimmed, message: 'INTERCEPT requires qubit and interceptor. Example: INTERCEPT q0 Eve' };
      }
      return { type: 'INTERCEPT', qubit: tokens[1].toLowerCase(), interceptor: tokens[2], lineNumber, raw: trimmed };
    }

    default:
      return { type: 'ERROR', lineNumber, raw: trimmed, message: `Unhandled command: ${command}` };
  }
}

/**
 * Parse full program text → array of instruction objects
 */
export function parseProgram(code) {
  const lines = code.split('\n');
  const instructions = [];
  const errors = [];

  lines.forEach((line, idx) => {
    const instruction = parseLine(line, idx + 1);
    if (!instruction) return; // skip empty lines
    if (instruction.type === 'ERROR') {
      errors.push(instruction);
    }
    instructions.push(instruction);
  });

  return { instructions, errors, valid: errors.length === 0 };
}
