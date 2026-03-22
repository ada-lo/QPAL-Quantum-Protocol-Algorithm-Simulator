/**
 * QPAL Quantum Simulation Engine
 * Simplified quantum state simulation without full linear algebra.
 * Uses flags and probabilistic logic to represent quantum behavior.
 */

/**
 * Create a fresh qubit state
 */
function createQubit(name) {
  return {
    name,
    value: 0,          // Classical value: 0 or 1
    superposition: false, // Is it in superposition?
    entangledWith: null,  // Name of entangled qubit (if any)
    owner: null,          // Actor who owns this qubit
    measured: false,      // Has it been measured?
    basis: null,          // Measurement basis used
  };
}

/**
 * Simulate Hadamard gate: puts qubit into superposition
 */
function applyH(qubit) {
  if (qubit.measured) {
    return { ...qubit, log: `⚠️ Cannot apply H to already-measured qubit ${qubit.name}` };
  }
  if (qubit.superposition) {
    // H applied twice → collapses back to classical (simplified)
    return {
      ...qubit,
      superposition: false,
      value: qubit.value,
      log: `H(${qubit.name}): collapsed superposition → |${qubit.value}⟩`
    };
  }
  return {
    ...qubit,
    superposition: true,
    log: `H(${qubit.name}): |${qubit.value}⟩ → |+⟩ (superposition)`
  };
}

/**
 * Simulate Pauli-X gate: flips qubit value
 */
function applyX(qubit) {
  if (qubit.measured) {
    return { ...qubit, log: `⚠️ Cannot apply X to already-measured qubit ${qubit.name}` };
  }
  const newVal = qubit.superposition ? qubit.value : (qubit.value === 0 ? 1 : 0);
  return {
    ...qubit,
    value: newVal,
    log: `X(${qubit.name}): flipped → |${newVal}⟩${qubit.superposition ? ' (in superposition)' : ''}`
  };
}

/**
 * Simulate CNOT gate: entangle control and target
 */
function applyCNOT(controlQubit, targetQubit) {
  if (controlQubit.measured || targetQubit.measured) {
    return {
      control: { ...controlQubit, log: `⚠️ Cannot CNOT measured qubits` },
      target: { ...targetQubit }
    };
  }

  let newTargetValue = targetQubit.value;

  if (!controlQubit.superposition) {
    // Classical: if control is |1⟩, flip target
    if (controlQubit.value === 1) {
      newTargetValue = targetQubit.value === 0 ? 1 : 0;
    }
  }

  const newControl = {
    ...controlQubit,
    entangledWith: targetQubit.name,
    log: `CNOT: ${controlQubit.name} controls ${targetQubit.name}`
  };

  const newTarget = {
    ...targetQubit,
    value: newTargetValue,
    superposition: controlQubit.superposition, // inherits superposition
    entangledWith: controlQubit.name,
  };

  return { control: newControl, target: newTarget };
}

/**
 * Simulate measurement: collapses superposition
 * Returns { qubit, result }
 */
function measureQubit(qubit, basis = 'Z') {
  if (qubit.measured) {
    return { qubit, result: qubit.value, log: `MEASURE(${qubit.name}): already measured → ${qubit.value}` };
  }

  let result;
  let log;

  if (qubit.superposition) {
    // Quantum randomness: 50/50 collapse
    result = Math.random() < 0.5 ? 0 : 1;
    log = `MEASURE(${qubit.name}) in ${basis} basis: superposition collapsed → |${result}⟩ (random)`;
  } else {
    result = qubit.value;
    if (basis === 'X' && !qubit.superposition) {
      // Measuring in X basis when in Z eigenstate → random
      result = Math.random() < 0.5 ? 0 : 1;
      log = `MEASURE(${qubit.name}) in X basis: incompatible basis → |${result}⟩ (random)`;
    } else {
      log = `MEASURE(${qubit.name}) in ${basis} basis: → |${result}⟩ (deterministic)`;
    }
  }

  return {
    qubit: { ...qubit, value: result, superposition: false, measured: true, basis },
    result,
    log
  };
}

// ─────────────────────────────────────────────
// Engine Class
// ─────────────────────────────────────────────

export class QuantumEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.qubits = {};       // { name: qubitState }
    this.actors = {};       // { name: { name } }
    this.measurements = {}; // { qubitName: result }
    this.stepLog = [];      // array of log strings
    this.channel = [];      // protocol channel messages
  }

  getState() {
    return {
      qubits: { ...this.qubits },
      actors: { ...this.actors },
      measurements: { ...this.measurements },
      stepLog: [...this.stepLog],
      channel: [...this.channel],
    };
  }

  executeInstruction(instruction) {
    const { type } = instruction;
    let log = '';
    let effect = null;

    switch (type) {
      case 'COMMENT': {
        log = `# ${instruction.text}`;
        break;
      }

      case 'INIT': {
        const { qubit } = instruction;
        this.qubits[qubit] = createQubit(qubit);
        log = `INIT ${qubit}: qubit initialized to |0⟩`;
        effect = { kind: 'qubit_created', qubit };
        break;
      }

      case 'H': {
        const { qubit } = instruction;
        if (!this.qubits[qubit]) {
          log = `⚠️ H: qubit "${qubit}" not initialized. Use INIT first.`;
          break;
        }
        const updated = applyH(this.qubits[qubit]);
        log = updated.log;
        delete updated.log;
        this.qubits[qubit] = updated;
        effect = { kind: 'gate_applied', gate: 'H', qubit };
        break;
      }

      case 'X': {
        const { qubit } = instruction;
        if (!this.qubits[qubit]) {
          log = `⚠️ X: qubit "${qubit}" not initialized. Use INIT first.`;
          break;
        }
        const updated = applyX(this.qubits[qubit]);
        log = updated.log;
        delete updated.log;
        this.qubits[qubit] = updated;
        effect = { kind: 'gate_applied', gate: 'X', qubit };
        break;
      }

      case 'CNOT': {
        const { control, target } = instruction;
        if (!this.qubits[control] || !this.qubits[target]) {
          log = `⚠️ CNOT: both qubits must be initialized. Missing: ${!this.qubits[control] ? control : target}`;
          break;
        }
        const result = applyCNOT(this.qubits[control], this.qubits[target]);
        log = result.control.log;
        delete result.control.log;
        this.qubits[control] = result.control;
        this.qubits[target] = result.target;
        effect = { kind: 'entangled', control, target };
        break;
      }

      case 'MEASURE': {
        const { qubit, basis } = instruction;
        if (!this.qubits[qubit]) {
          log = `⚠️ MEASURE: qubit "${qubit}" not initialized.`;
          break;
        }
        const result = measureQubit(this.qubits[qubit], basis);
        log = result.log;
        this.qubits[qubit] = result.qubit;
        this.measurements[qubit] = result.result;
        effect = { kind: 'measured', qubit, result: result.result, basis };

        // If entangled, collapse partner
        const partner = this.qubits[qubit].entangledWith;
        if (partner && this.qubits[partner]) {
          const partnerQ = this.qubits[partner];
          if (!partnerQ.measured) {
            // Entanglement collapse: partner gets correlated result
            const partnerResult = result.result; // simplified: same result
            this.qubits[partner] = { ...partnerQ, value: partnerResult, superposition: false, measured: false };
            log += ` | Entangled ${partner} → |${partnerResult}⟩`;
          }
        }
        break;
      }

      case 'ACTOR': {
        const { name } = instruction;
        this.actors[name] = { name, qubits: [] };
        log = `ACTOR ${name}: registered`;
        effect = { kind: 'actor_created', actor: name };
        break;
      }

      case 'ASSIGN': {
        const { qubit, actor } = instruction;
        if (!this.qubits[qubit]) {
          log = `⚠️ ASSIGN: qubit "${qubit}" not initialized.`;
          break;
        }
        if (!this.actors[actor]) {
          this.actors[actor] = { name: actor, qubits: [] };
        }
        this.qubits[qubit] = { ...this.qubits[qubit], owner: actor };
        if (!this.actors[actor].qubits.includes(qubit)) {
          this.actors[actor].qubits = [...(this.actors[actor].qubits || []), qubit];
        }
        log = `ASSIGN ${qubit} → ${actor}`;
        effect = { kind: 'assigned', qubit, actor };
        break;
      }

      case 'SEND': {
        const { qubit, from, to } = instruction;
        if (!this.qubits[qubit]) {
          log = `⚠️ SEND: qubit "${qubit}" not initialized.`;
          break;
        }
        this.qubits[qubit] = { ...this.qubits[qubit], owner: to };
        const msg = `📡 SEND: ${from} → ${to} [qubit: ${qubit}] value=${this.qubits[qubit].superposition ? '?' : this.qubits[qubit].value}`;
        this.channel.push({ from, to, qubit, step: this.stepLog.length });
        log = msg;
        effect = { kind: 'sent', qubit, from, to };
        break;
      }

      case 'INTERCEPT': {
        const { qubit, interceptor } = instruction;
        if (!this.qubits[qubit]) {
          log = `⚠️ INTERCEPT: qubit "${qubit}" not initialized.`;
          break;
        }
        // Eve intercepts: measures in random basis (introduces errors)
        const eveBasis = Math.random() < 0.5 ? 'Z' : 'X';
        const interceptResult = measureQubit(this.qubits[qubit], eveBasis);
        // Eve re-prepares the qubit (she can't clone perfectly)
        const rePrepared = createQubit(qubit);
        rePrepared.value = interceptResult.result;
        rePrepared.owner = this.qubits[qubit].owner; // keep original owner
        this.qubits[qubit] = rePrepared;
        this.channel.push({ from: interceptor, to: 'channel', qubit, intercepted: true, step: this.stepLog.length });
        log = `🕵️ INTERCEPT by ${interceptor}: measured ${qubit} in ${eveBasis} basis → |${interceptResult.result}⟩ (re-prepared, may introduce error)`;
        effect = { kind: 'intercepted', qubit, interceptor, basis: eveBasis, result: interceptResult.result };
        break;
      }

      case 'ERROR': {
        log = `❌ Parse Error (line ${instruction.lineNumber}): ${instruction.message}`;
        break;
      }

      default:
        log = `⚠️ Unknown instruction type: ${type}`;
    }

    const step = {
      instruction,
      log,
      effect,
      stateBefore: null, // could snapshot state here if needed
      stateAfter: this.getState(),
    };

    this.stepLog.push(log);
    return step;
  }
}
