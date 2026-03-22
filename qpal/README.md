# QPAL — Quantum Protocol & Algorithm Simulator

QPAL is a browser-based simulator for learning quantum algorithms and quantum communication protocols through code, visualization, and controlled experimentation.

## Quick Start

Open `index.html` in a modern browser. No bundler, server, or install step is required for the standalone app.

For local validation:

```bash
npm test
```

## Product Focus

QPAL is built around three pillars:

1. Algorithm Mode
2. Protocol Mode
3. Code Interface

### 1. Algorithm Mode

Implemented algorithm presets:

- Bell State
- GHZ State
- Quantum Teleportation
- Superdense Coding
- Deutsch's Algorithm
- SWAP Test
- Custom Algorithm

### 2. Protocol Mode

Implemented protocol presets:

- BB84
- E91
- Quantum Teleportation Protocol
- Superdense Coding Protocol
- Custom Protocol

BB84 and E91 both include statistical security summaries with Eve toggling.

### 3. Code Interface

Supported pseudo-language commands:

```text
INIT <qubit>
H <qubit>
X <qubit>
CNOT <control> <target>
MEASURE <qubit> [BASIS X|Z]
ACTOR <name>
ASSIGN <qubit> <actor>
SEND <qubit> <from> <to>
INTERCEPT <qubit> <actor>
```

## Architecture

```text
User Input / Preset
        ↓
parseProgram(code)
        ↓
ExecutionController.load(instructions)
        ↓
QuantumEngine.executeInstruction(...)
        ↓
Circuit / State / Channel / Analytics UI
```

## Project Structure

```text
qpal/
├── index.html
├── README.md
└── src/
    ├── engine/
    │   ├── controller.js
    │   └── engine.js
    ├── parser/
    │   └── parser.js
    └── presets/
        ├── advancedAlgorithms.js
        ├── advancedProtocols.js
        ├── bb84.js
        ├── bellState.js
        ├── catalog.js
        └── protocolAnalytics.js
```

## Standalone App vs Modular Source

- `index.html` is the full runnable standalone application
- `src/` contains the reusable logic and preset catalog mirrored from the standalone app

This keeps the project easy to demo while also making the source easier to extend and test.

## Simulation Model

QPAL uses a simplified flag-based quantum model for teaching:

- `value`
- `superposition`
- `entangledWith`
- `measured`
- `owner`

This makes the UI easy to follow and supports protocol storytelling, while keeping implementation simple and hackable.

## Testing

The repository includes lightweight regression tests for:

- parser behavior
- preset catalog coverage
- BB84 analytics
- E91 analytics

## Next Extensions

- conditional correction gates for protocol examples
- richer gate coverage
- noise-aware channels
- SVG/JSON export
- optional integration with external quantum SDKs

## License

MIT
