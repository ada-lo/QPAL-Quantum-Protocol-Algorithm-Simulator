# QPAL — Quantum Protocol & Algorithm Simulator

A web-based interactive simulator for exploring quantum algorithms and cryptographic protocols.

---

## 🚀 Quick Start

Open `index.html` in any modern browser. No build step, no server required.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        QPAL System                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │   User   │───▶│  Parser  │───▶│ Simulation Engine │  │
│  │  Input   │    │          │    │                  │  │
│  │ (editor) │    │ Text →   │    │ QuantumEngine    │  │
│  └──────────┘    │ JSON AST │    │ ExecutionCtrl    │  │
│                  └──────────┘    └────────┬─────────┘  │
│                                           │             │
│  ┌────────────────────────────────────────▼──────────┐  │
│  │               React/HTML UI Layer                  │  │
│  │                                                    │  │
│  │  ┌───────────┐  ┌────────────┐  ┌─────────────┐  │  │
│  │  │ModeSelector│  │Circuit Viz │  │Protocol Flow│  │  │
│  │  └───────────┘  └────────────┘  └─────────────┘  │  │
│  │  ┌───────────┐  ┌────────────┐  ┌─────────────┐  │  │
│  │  │CodeEditor │  │State Panel │  │ Output Log  │  │  │
│  │  └───────────┘  └────────────┘  └─────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User types code
      │
      ▼
parseProgram(code)
      │ → [{ type, qubit, lineNumber, ... }, ...]
      │ → errors[]
      ▼
ExecutionController.load(instructions)
      │
      ▼
stepForward() or runAll()
      │
      ▼
QuantumEngine.executeInstruction(inst)
      │ → { log, effect, stateAfter }
      ▼
UI renders: Circuit / State / Protocol / Log
```

---

## 2. Project Structure

```
qpal/
├── index.html              ← Complete standalone app (all-in-one)
├── README.md               ← This file
├── src/                    ← Modular source files (for React build)
│   ├── parser/
│   │   └── parser.js       ← Pseudo-code → JSON instruction objects
│   ├── engine/
│   │   ├── engine.js       ← Quantum gate simulation
│   │   └── controller.js   ← Step-by-step execution management
│   └── presets/
│       ├── bellState.js    ← Bell state preset + templates
│       └── bb84.js         ← BB84 protocol + statistical simulation
```

---

## 3. Pseudo-language Reference

```
# Comments start with # or //

# Qubit Operations
INIT q0              # Initialize qubit to |0⟩
H q0                 # Hadamard gate (superposition)
X q0                 # Pauli-X / NOT gate (flip)
CNOT q0 q1           # Controlled-NOT (entangle)
MEASURE q0           # Measure in Z basis (default)
MEASURE q0 BASIS X   # Measure in X basis
MEASURE q0 BASIS Z   # Measure in Z basis

# Protocol Operations
ACTOR Alice          # Declare a protocol participant
ASSIGN q0 Alice      # Give qubit ownership to actor
SEND q0 Alice Bob    # Transmit qubit between actors
INTERCEPT q0 Eve     # Eve intercepts (introduces errors)
```

### Rules
- One command per line
- Case insensitive
- Qubit names: any identifier (q0, qubit_A, etc.)
- Actor names: any identifier (Alice, Bob, Eve, etc.)
- Invalid commands produce parse errors with line numbers

---

## 4. Simulation Model (Simplified Quantum Logic)

Rather than full linear algebra (density matrices, tensor products), QPAL uses a flag-based model:

| Property | Description |
|----------|-------------|
| `value` | Classical value: 0 or 1 |
| `superposition` | Boolean flag: in quantum superposition |
| `entangledWith` | Name of entangled partner qubit |
| `measured` | Whether qubit has been collapsed |
| `owner` | Protocol actor who holds the qubit |

### Gate Logic

| Gate | Effect |
|------|--------|
| `H` | Sets `superposition = true`; double-H collapses back |
| `X` | Flips `value` (0↔1) |
| `CNOT` | If control is |1⟩, flips target; creates entanglement link |
| `MEASURE` | Collapses superposition randomly (50/50); updates entangled partner |
| `INTERCEPT` | Eve measures in random basis, re-prepares qubit — may introduce error |

---

## 5. Presets

### Bell State (Algorithm Mode)
Demonstrates quantum entanglement:
1. `INIT q0, q1` → both start at |0⟩
2. `H q0` → q0 enters superposition |+⟩
3. `CNOT q0 q1` → creates entangled pair |Φ+⟩ = (|00⟩ + |11⟩)/√2
4. `MEASURE` → both qubits always collapse to the same value

### BB84 Protocol (Protocol Mode)
Demonstrates quantum key distribution:
- Alice prepares qubits in random bases
- Eve optionally intercepts (introduces ~25% errors)
- Bob measures in random bases
- Error rate > 11% → eavesdropping detected

The **statistical BB84 panel** runs 16 rounds, showing:
- Per-bit basis comparison table
- Error rate calculation
- Shared key generation
- Eavesdropping detection alert

---

## 6. Example Inputs

### Bell State
```
INIT q0
INIT q1
H q0
CNOT q0 q1
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z
```

### BB84 with Eve
```
ACTOR Alice
ACTOR Bob
ACTOR Eve
INIT q0
H q0
ASSIGN q0 Alice
INTERCEPT q0 Eve
SEND q0 Alice Bob
MEASURE q0 BASIS Z
```

### Custom: GHZ State (3-qubit entanglement)
```
INIT q0
INIT q1
INIT q2
H q0
CNOT q0 q1
CNOT q0 q2
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z
MEASURE q2 BASIS Z
```

---

## 7. UI Controls

| Control | Action |
|---------|--------|
| **▶ Run** | Parse and execute all instructions at once |
| **⏭ Step** | Execute one instruction at a time |
| **↺ Reset** | Clear state and log |
| **Circuit tab** | Show qubit wires and gate boxes |
| **State tab** | Show qubit state cards with properties |
| **Channel tab** | Show protocol actor flow and channel events |

---

## 8. Future Extensions

### Near-term
- **Noise simulation**: Add configurable depolarizing noise to MEASURE and SEND
- **Bloch sphere**: Visualize single qubit state as 3D vector
- **More presets**: Quantum teleportation, superdense coding, Grover's algorithm

### Medium-term
- **Multi-qubit scaling**: Support 4+ qubit circuits with proper entanglement
- **State vector display**: Show probability amplitudes for N-qubit systems
- **Export**: Save circuit diagrams as SVG or PDF

### Long-term
- **Backend integration**: Connect to real quantum simulators (Qiskit, Cirq)
- **Collaborative mode**: Share circuits via URL
- **Lesson mode**: Guided tutorials with checkpoints

---

## License

MIT — built for educational purposes.
