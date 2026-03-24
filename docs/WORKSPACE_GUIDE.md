# QPAL Workspace Guide

## Overview

QPAL is an interactive quantum workspace for understanding, analyzing, and experimenting with quantum algorithms and communication protocols.

The workspace follows a pseudocode-first flow:

Flow:

1. The user writes pseudocode in the editor.
2. The TypeScript parser converts it into structured instruction objects.
3. The frontend sends those instruction objects to the backend.
4. The FastAPI workspace executor simulates the program step by step.
5. The frontend renders the returned state as:
   - a circuit timeline
   - measurement and transport logs
   - Bloch vectors
   - benchmark results

## Frontend Architecture

Key files:

- `frontend/src/App.tsx`
  Active app entry. It now renders only the workspace page.
- `frontend/src/components/workspace/WorkspacePage.tsx`
  Main screen: editor, circuit timeline, inspector, theme switch, resizable right pane.
- `frontend/src/components/workspace/WorkspaceTimeline.tsx`
  Renders parsed instructions as a circuit-like horizontal timeline.
- `frontend/src/components/workspace/WorkspaceInspectors.tsx`
  State, docs, and benchmark panels.
- `frontend/src/components/workspace/WorkspaceBlochPanel.tsx`
  Zoomable Bloch sphere cards.
- `frontend/src/lib/workspace/pseudoParser.ts`
  Custom parser that validates syntax and expands macros.
- `frontend/src/lib/workspace/api.ts`
  Workspace API client.
- `frontend/src/lib/workspace/types.ts`
  Shared frontend types for parser and backend responses.

## Backend Architecture

Key files:

- `backend/api/routes/workspace.py`
  Catalog, simulation, and benchmark endpoints.
- `backend/api/schemas/workspace.py`
  Pydantic models for workspace requests and responses.
- `backend/core/workspace/catalog.py`
  Syntax reference, template programs, benchmark catalog.
- `backend/core/workspace/executor.py`
  Simplified state engine for qubits, actors, transport, and measurements.
- `backend/core/workspace/benchmarks.py`
  GHZ/QFT/Grover/QAOA-style benchmark generation and timing.

## Pseudo Language

### Core quantum syntax

```text
INIT q0
INIT q1 1
INIT q2 +
RESET q0
H q0
X q0
Y q0
Z q0
CNOT q0 q1
SWAP q0 q1
MEASURE q0
MEASURE q0 BASIS X
MEASURE q0 [BASIS Z]
```

### Actor and transport syntax

```text
ACTOR Alice
ACTOR Bob
ASSIGN q0 Alice
SEND q0 Alice Bob
INTERCEPT q0 Eve
```

### Annotation syntax

```text
LABEL BellPair
NOTE Eve may disturb the channel here
WAIT 1
BARRIER
```

### Macro syntax

```text
SUPERPOSE q0
ENTANGLE q0 q1
BELL q0 q1
```

Macro expansion:

- `SUPERPOSE q0` -> `H q0`
- `ENTANGLE q0 q1` -> `H q0`, `CNOT q0 q1`
- `BELL q0 q1` -> `INIT q0`, `INIT q1`, `H q0`, `CNOT q0 q1`

## Parser Behavior

The parser:

- strips blank lines and comments
- validates command names
- validates qubit names like `q0`, `q1`, `q12`
- validates actor names like `Alice`, `Bob`, `Eve_1`
- validates missing arguments
- accepts both `MEASURE q0 BASIS X` and `MEASURE q0 [BASIS X]`
- expands supported macros into primitive instruction objects
- returns:
  - `instructions`
  - `errors`
  - `warnings`
  - discovered qubits
  - discovered actors

## Simulation Model

This workspace uses a simplified execution engine instead of full quantum state-vector math.

Tracked concepts:

- initialized/uninitialized qubits
- simple state labels: `0`, `1`, `+`, `-`, `mixed`
- superposition flag
- basic entanglement links
- actor ownership and location
- send/intercept history
- random measurement outcomes where appropriate

Supported backend operations:

- `INIT`
- `RESET`
- `H`
- `X`
- `Y`
- `Z`
- `CNOT`
- `SWAP`
- `MEASURE`
- `ACTOR`
- `ASSIGN`
- `SEND`
- `INTERCEPT`
- `LABEL`
- `NOTE`
- `WAIT`
- `BARRIER`

Important simplifications:

- `CNOT` creates a simple entanglement relation when superposition is involved.
- `INTERCEPT` can disturb a qubit by forcing a hidden Z-basis collapse.
- `MEASURE` uses deterministic or random outcomes based on the current simplified label.
- Bloch vectors are heuristic projections from those simplified labels.

## Step-by-Step Execution

Each backend execution response includes:

- `summary`
- `steps`
- `final_state`
- `measurement_results`
- `warnings`

Each `step` includes:

- the instruction that ran
- a human-readable event description
- the full current execution state snapshot

That state snapshot powers:

- the timeline highlight
- the state inspector
- the measurement panel
- the transport log
- the Bloch panel

## Templates

Integrated templates currently include:

- Bell Pair Starter
- BB84 With Eve
- Teleportation Walkthrough
- Superdense Coding
- Grover's Search *(PennyLane-derived)*
- Quantum Fourier Transform *(PennyLane-derived)*
- QAOA MaxCut *(PennyLane-derived)*
- VQE Ansatz (H₂ molecule) *(PennyLane-derived)*
- Quantum Phase Estimation *(PennyLane-derived)*

They are all loaded from the backend catalog so the UI, syntax docs, and backend expectations stay aligned.

## Benchmarks

The benchmark tab runs backend-generated circuit families inspired by the public MQT Bench benchmark repository.

Current families:

- GHZ
- QFT
- Grover
- QAOA

The backend reports:

- CPU name
- CPU core count
- GPU availability
- benchmark duration
- circuit depth
- gate count
- engine used

If GPU execution is available through Aer on the local machine, the benchmark service tries to use it and reports that in the response. Otherwise it falls back to CPU execution.

## UI Notes

- The right inspector pane is resizable on desktop.
- The Bloch spheres support zoom via mouse wheel or trackpad pinch.
- The active theme is stored in local storage.
- The mobile layout collapses the two-pane desktop grid into a single column.
