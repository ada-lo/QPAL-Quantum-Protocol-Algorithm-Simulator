/**
 * QPAL Execution Controller
 * Manages step-by-step execution of parsed instructions.
 */

import { QuantumEngine } from './engine.js';

export class ExecutionController {
  constructor() {
    this.engine = new QuantumEngine();
    this.instructions = [];
    this.currentStep = -1;
    this.history = []; // array of { step, state, log }
    this.running = false;
  }

  load(instructions) {
    this.engine.reset();
    this.instructions = instructions.filter(i => i.type !== 'COMMENT');
    this.currentStep = -1;
    this.history = [];
    this.running = false;
  }

  canStep() {
    return this.currentStep < this.instructions.length - 1;
  }

  isComplete() {
    return this.currentStep >= this.instructions.length - 1;
  }

  stepForward() {
    if (!this.canStep()) return null;
    this.currentStep++;
    const instruction = this.instructions[this.currentStep];
    const result = this.engine.executeInstruction(instruction);
    this.history.push({ step: this.currentStep, result, state: this.engine.getState() });
    return result;
  }

  runAll() {
    const results = [];
    while (this.canStep()) {
      const result = this.stepForward();
      results.push(result);
    }
    return results;
  }

  reset() {
    this.engine.reset();
    this.currentStep = -1;
    this.history = [];
    this.running = false;
  }

  getProgress() {
    const total = this.instructions.length;
    const done = this.currentStep + 1;
    return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  }

  getFinalState() {
    return this.engine.getState();
  }
}
