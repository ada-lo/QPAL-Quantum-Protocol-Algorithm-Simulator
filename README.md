# QPAL — Quantum Protocol & Algorithm Simulator

QPAL is an interactive quantum learning and experimentation environment focused on two things:

- algorithm simulation with a code-first workflow
- communication protocol visualization with Alice/Bob/Eve style actors

The project in this repository is a zero-build browser app backed by modular ES modules and a lightweight Node test suite. It is intentionally educational: the simulator uses a simplified state model so learners can see behavior, steps, and channel effects without needing a heavy backend.

## What Is Implemented

- Algorithm mode with Bell state, GHZ state, teleportation, superdense coding, Deutsch's algorithm, SWAP test, and custom pseudo-code circuits
- Protocol mode with BB84, E91, teleportation flow, superdense coding flow, and custom multi-party pseudo-code
- A pseudo-language parser for `INIT`, `H`, `X`, `CNOT`, `MEASURE`, `ACTOR`, `ASSIGN`, `SEND`, and `INTERCEPT`
- Step-by-step execution with circuit, state, channel, and event-log views
- Statistical security panels for BB84 and E91 with Eve toggling and shared-key/error summaries
- Modular source files in `qpal/src/` that mirror the standalone browser app presets and analytics
- Node-based regression tests for parsing, preset catalog integrity, and protocol analytics

## Quick Start

### Run the app

Open `qpal/index.html` in a modern browser.

You can also open the mirrored root copy:

- `qpal/index.html`
- `qpal-index.html`

No build step or server is required.

### Run the tests

```bash
npm test
```

This uses Node's built-in test runner and does not require extra dependencies.

## Architecture

```text
User code / preset
        ↓
Parser
        ↓
ExecutionController
        ↓
QuantumEngine
        ↓
Visualization + protocol analytics
```

### Main layers

- `qpal/src/parser/parser.js`: pseudo-language to instruction objects
- `qpal/src/engine/engine.js`: simplified qubit, gate, actor, and channel behavior
- `qpal/src/engine/controller.js`: run/step/reset orchestration
- `qpal/src/presets/`: algorithm presets, protocol presets, catalogs, and analytics helpers
- `qpal/index.html`: full standalone experience

## Project Structure

```text
QPAL-Quantum-Protocol-Algorithm-Simulator/
├── package.json
├── qpal-index.html
├── qpal/
│   ├── index.html
│   ├── README.md
│   └── src/
│       ├── engine/
│       ├── parser/
│       └── presets/
└── tests/
```

## Simulation Model

QPAL currently uses a simplified instructional model rather than a full state-vector or density-matrix backend.

That means it is well suited for:

- classroom demos
- concept exploration
- protocol storytelling
- rapid pseudo-code experiments

It is not yet a mathematically exact replacement for Qiskit, Cirq, or hardware-backed simulators.

## Roadmap

### Near term

- finish moving standalone UI logic into reusable modules
- add more deterministic testing around protocol analytics
- improve conditional correction handling in teleportation-style examples

### Future extensions

- richer gate set and basis handling
- noise models
- export/share features
- optional integration with real quantum SDKs

## License

MIT
