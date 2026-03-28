# QPAL Workspace Guide

## Purpose

QPAL is a workspace-first quantum learning app with three execution modes:

- `custom`: QPAL pseudocode parsed into workspace instructions and executed by the backend symbolic runtime plus the built-in `_MiniSV` statevector helper
- `openqasm`: raw OpenQASM 3.0 executed through the Qiskit adapter
- `qunetsim`: Python-like network scripts executed through the QuNetSim adapter or the local stub layer

The current app is centered on the workspace experience in `frontend/src/components/workspace/WorkspacePage.tsx`, with `/docs` as a secondary route for template browsing.

## Runtime Flow

The workspace is no longer a simple "parse once, send instructions" pipeline. The current flow is:

1. The user edits source in Monaco on `WorkspacePage`.
2. The frontend parser in `frontend/src/lib/workspace/pseudoParser.ts` validates QPAL pseudocode for immediate UX feedback.
3. Parsed instructions are mirrored into the visual circuit store through `frontend/src/lib/workspace/programToCircuit.ts`.
4. Circuit edits flow back into text through `frontend/src/lib/workspace/circuitToProgram.ts`.
5. A debounced effect posts the raw source string plus the selected engine to `POST /api/workspace/simulate`.
6. The backend route in `backend/api/routes/workspace.py` dispatches to one of three engines:
   - `custom` -> `backend/core/workspace/parser.py` + `backend/core/workspace/executor.py`
   - `openqasm` -> `backend/core/engines/qasm_engine.py`
   - `qunetsim` -> `backend/core/engines/qunetsim_engine.py`
7. The response drives the inspector panels, walkthrough modal, state cards, Bloch panel, and benchmark/analysis affordances.

## Frontend Architecture

### Core workspace shell

- `frontend/src/App.tsx`
  Defines the `/` workspace route and `/docs` route behind an error boundary.
- `frontend/src/components/workspace/WorkspacePage.tsx`
  Owns the main layout, source editor, engine switcher, template/model selection, execution loop, and text-to-circuit synchronization.
- `frontend/src/components/workspace/WorkspaceCircuitBuilder.tsx`
  Hosts the editable circuit grid, gate palette, undo/redo, URL sync, and local circuit simulator hooks.
- `frontend/src/components/workspace/WorkspaceInspectors.tsx`
  Renders the state inspector, docs panel, benchmark panel, and template parameter controls.
- `frontend/src/components/workspace/WorkspaceAnalysisPanel.tsx`
  Calls the analysis endpoint and displays entanglement, landscape, and Stim/QEC outputs.

### Parsing and sync layer

- `frontend/src/lib/workspace/pseudoParser.ts`
  Frontend parser for QPAL pseudocode. Returns `instructions`, `errors`, `warnings`, discovered qubits, and discovered actors.
- `frontend/src/lib/workspace/programToCircuit.ts`
  Converts parsed instructions into the circuit-grid snapshot used by the visual editor.
- `frontend/src/lib/workspace/circuitToProgram.ts`
  Converts the circuit store back into QPAL pseudocode so drag-and-drop edits remain editable as source.
- `frontend/src/lib/workspace/api.ts`
  Thin fetch client for catalog, simulate, and benchmark requests.
- `frontend/src/lib/workspace/types.ts`
  Shared TypeScript view models for parser output and API payloads.

### State and selection

- `frontend/src/store/simStore.ts`
  Stores engine selection, pre-flight settings, walkthrough state, and template parameter hydration.
- `frontend/src/store/circuitStore.ts`
  Owns the circuit grid state used by the workspace builder and sync layer.
- `frontend/src/utils/languagePresets.ts`
  Contains engine-specific example snippets for a subset of templates.

## Backend Architecture

### API surface

- `backend/main.py`
  FastAPI bootstrap, CORS setup, `/health`, and router registration.
- `backend/api/routes/workspace.py`
  Exposes `/api/workspace/catalog`, `/simulate`, `/benchmarks`, and `/analyze`.
- `backend/api/schemas/workspace.py`
  Pydantic request and response models for instructions, execution snapshots, catalog data, benchmarks, and analysis.

### Custom workspace engine

- `backend/core/workspace/parser.py`
  Python parser for QPAL pseudocode. Used by the backend `custom` engine path.
- `backend/core/workspace/executor.py`
  Symbolic workspace runtime plus `_MiniSV`, a lightweight pure-Python statevector simulator used to keep Bloch vectors and some measurement behavior grounded in actual amplitudes.
- `backend/core/workspace/catalog.py`
  Source of truth for syntax reference items, template programs, benchmark profiles, and architecture notes returned by the catalog endpoint.
- `backend/core/workspace/benchmarks.py`
  Pure-Python benchmark runner backed by `_MiniSV`.
- `backend/core/workspace/analysis.py`
  Optional analysis endpoint for entanglement metrics, parameter landscapes, and Stim-based stabilizer runs.

### Alternate engines

- `backend/core/engines/qasm_engine.py`
  Qiskit-backed OpenQASM executor. Produces state snapshots from statevectors and measurement summaries from shot counts.
- `backend/core/engines/qunetsim_engine.py`
  Executes user code in a restricted namespace and logs send/measure events through either wrappers around real QuNetSim classes or local stub implementations.

## QPAL Pseudocode

### Supported comments

The parser skips blank lines plus lines starting with:

- `#`
- `//`

### Quantum operations

```text
INIT q0
INIT q1 1
INIT q2 +
INIT q3 -
RESET q0
H q0
X q0
Y q0
Z q0
S q0
T q0
SDG q0
TDG q0
SX q0
RX q0 1.5708
RY q0 1.5708
RZ q0 1.5708
CNOT q0 q1
SWAP q0 q1
CZ q0 q1
TOFFOLI q0 q1 q2
MEASURE q0
MEASURE q0 BASIS X
MEASURE q0 [BASIS Z]
```

### Actor and transport operations

```text
ACTOR Alice
ASSIGN q0 Alice
SEND q0 Alice Bob
INTERCEPT q0 Eve
```

### Annotations and control markers

```text
LABEL Bell Pair
NOTE Eve may disturb the channel
WAIT 1
BARRIER
```

### Macros

```text
SUPERPOSE q0
ENTANGLE q0 q1
BELL q0 q1
```

Current macro expansion rules:

- `SUPERPOSE q0` -> `H q0`
- `ENTANGLE q0 q1` -> `H q0`, `CNOT q0 q1`
- `BELL q0 q1` -> `INIT q0`, `INIT q1`, `H q0`, `CNOT q0 q1`

## Frontend Parser Behavior

The frontend parser is the strictest validation layer in the app. It:

- validates opcode names
- validates qubit tokens like `q0`, `q1`, `q12`
- validates actor names like `Alice`, `Bob`, `Eve_1`
- validates argument counts
- validates numeric rotation angles
- validates `MEASURE` basis tokens
- expands macros and reports expansion warnings
- returns structured issues instead of failing hard

The parser result powers:

- parser feedback cards
- JSON instruction preview
- text-to-circuit conversion
- discovered actor/qubit metadata

## Custom Engine Behavior

The backend `custom` engine tracks more than just gate order. Each step snapshot can include:

- qubit initialization state
- simplified state labels: `0`, `1`, `+`, `-`, `mixed`, `uninitialized`
- superposition flag
- entanglement links
- actor ownership and location
- measurement records
- transport and intercept records
- Bloch vectors derived from `_MiniSV` when available

Important runtime notes:

- The symbolic runtime is intentionally simplified for pedagogy.
- `_MiniSV` is capped at 12 qubits.
- `CNOT`, `CZ`, and `TOFFOLI` switch into simplified correlation or entanglement behavior when superposition or prior entanglement is present.
- `INTERCEPT` can force a hidden Z-basis collapse.
- `MEASURE BASIS X` collapses through the statevector helper so the returned Bloch vector lands on the X axis rather than the Z axis.

## Circuit Sync Rules

The visual circuit and text editor are kept in sync, but the conversion is intentionally lossy in a few places.

### Source to circuit

- leading `INIT` and `RESET` instructions are mapped into circuit initial states until an operational gate appears
- later `INIT` and `RESET` instructions are approximated as executable gate sequences
- `MEASURE BASIS X` becomes `H` plus `MEASURE` in the circuit model
- actor, transport, and annotation instructions advance timeline steps but do not become circuit gates

### Circuit to source

- the generated source always starts with `LABEL Circuit Workspace`
- each qubit gets an `INIT`
- each circuit column is separated by `BARRIER`
- display-only gates become `NOTE` lines

This means the circuit surface is best understood as a structural visualization for the quantum portion of a program, not a perfect reversible representation of every workspace instruction.

## Catalog, Templates, and Presets

The catalog endpoint is the main backend source of truth for:

- syntax reference entries
- template metadata
- benchmark profiles
- architecture notes shown in the docs panel

There is an additional frontend preset layer in `frontend/src/utils/languagePresets.ts` that can substitute engine-specific examples for some template IDs. That layer is partial and should be treated as an augmentation, not the canonical template source.

## Benchmarks and Analysis

### Benchmarks

The benchmark endpoint exposes benchmark families backed by `_MiniSV`, including:

- GHZ
- QFT
- Grover
- QAOA
- VQE
- QPE
- W-State
- Deutsch-Jozsa

The current implementation reports CPU and optional GPU metadata, but the benchmark runner itself executes on the built-in CPU-side `_MiniSV` path.

### Analysis

The analysis endpoint supports optional modules:

- entanglement metrics via `toqito` when installed, otherwise purity-only fallback
- parameter landscapes with optional matplotlib image output
- Stim-based stabilizer or QEC runs when `stim` is installed

## Current Caveats

These are important for contributors working on the workspace:

- The frontend and backend QPAL parsers are similar but not identical; keep them aligned when changing syntax.
- The workspace auto-executes debounced source updates, so parser and runtime drift is user-visible immediately.
- Template presets only cover a subset of catalog templates.
- GPU selection in the UI is currently more of a capability hint than a guaranteed execution path for the custom workspace engine or benchmark runner.
- The QuNetSim adapter is event-oriented; it is not a full fidelity network debugger.

## Recommended Maintenance Work

If you continue improving the workspace, these are the highest-value follow-ups:

1. Unify parser validation rules and error handling between `frontend/src/lib/workspace/pseudoParser.ts` and `backend/core/workspace/parser.py`.
2. Make template engine selection capability-aware instead of switching templates to QuNetSim or OpenQASM presets by template kind alone.
3. Document or implement the actual meaning of `compute` and `prefer_gpu` across frontend controls and backend execution.
4. Add end-to-end tests that cover text editing, template loading, engine switching, and build verification.

## Local Verification

Useful commands from the repo root:

```bash
npm run build
npm run type-check --prefix frontend
cd backend && python -m pytest tests/ -v
```

If you update parser rules or instruction schemas, verify both the frontend parser path and the backend `custom` engine path before merging.
