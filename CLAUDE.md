# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## QPAL (Quantum Protocol & Algorithm Simulator)

Full-stack educational quantum simulator with a Tri-Engine backend (Custom Parser, OpenQASM 3.0, QuNetSim) and a React + Three.js 3D visualizer frontend.

## Core Design Principle: Three-Engine Architecture

**All three execution engines must return the exact same Pydantic response schema** (`WorkspaceSimulateResponse`). Never remove or deprecate any engine:

| Engine | Input | Implementation Path |
|---|---|---|
| `custom` | QPAL pseudocode | `parser.py` → `executor.py` with `_MiniSV` statevector |
| `openqasm` | OpenQASM 3.0 | `qasm_engine.py` via Qiskit (eager import) |
| `qunetsim` | Python/QuNetSim | `qunetsim_engine.py` with host/monitor interception |

The API contract is strict — frontend Bloch sphere visualizers depend on exact field names and structure. See `backend/api/schemas/workspace.py` for authoritative models.

## Common Development Commands

### Root Level (convenience scripts)
```bash
npm run dev:frontend     # Start Vite dev server on :5173
npm run dev:backend      # Start uvicorn on :8000
npm run build            # Production frontend build
npm run test:backend     # Run backend pytest suite
```

### Frontend (`frontend/`)
```bash
pnpm install             # Install dependencies (NEVER use npm here)
pnpm dev                 # Vite dev server on :5173
pnpm build               # TypeScript check + production build
pnpm preview             # Preview production build
pnpm lint                # ESLint with strict rules (max-warnings=0)
pnpm type-check          # tsc --noEmit (type-only check)
```

### Backend (`backend/`)
```bash
# From repo root:
cd backend && python -m uvicorn main:app --reload --port 8000

# Run tests (verbose):
cd backend && python -m pytest tests/ -v

# Single test file or keyword:
cd backend && python -m pytest tests/test_workspace.py -v -k test_workspace_bell_style_flow

# Run a specific test function:
cd backend && python -m pytest tests/test_workspace.py::test_bloch_bell_state_entangled -v
```

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # macOS/Linux
# or: .venv\Scripts\activate  (Windows)
pip install -r requirements.txt
```

## Architecture Overview

### Request/Response Flow

1. User writes QPAL pseudocode in Monaco editor (`WorkspacePage.tsx`)
2. Frontend parser (`pseudoParser.ts`) validates for immediate feedback
3. Debounced POST to `/api/workspace/simulate` with `{ code, engine }`
4. Backend route (`routes/workspace.py`) dispatches to selected engine
5. Engine returns `WorkspaceSimulateResponse` — strict TypedDict/Pydantic contract
6. Frontend renders step-by-step state traces, Bloch spheres, circuit diagrams

### Key Directory Layout

```
backend/
├── main.py                          # FastAPI app, CORS hardcoded to :5173
├── requirements.txt                 # 4 core packages + optional deps
├── api/
│   ├── routes/
│   │   ├── workspace.py            # /catalog, /simulate, /benchmarks, /analyze
│   │   └── templates.py            # Algorithm template CRUD
│   └── schemas/
│       └── workspace.py            # All Pydantic models (R→I/O contract)
├── core/
│   ├── engines/
│   │   ├── qasm_engine.py          # OpenQASM 3.0 via Qiskit
│   │   └── qunetsim_engine.py      # QuNetSim script executor
│   └── workspace/
│       ├── parser.py               # QPAL pseudocode → WorkspaceInstruction[]
│       ├── executor.py             # Symbolic runtime + _MiniSV statevector
│       ├── catalog.py              # Algorithm templates + benchmarks
│       ├── benchmarks.py           # Zero-dep benchmark runner
│       ├── analysis.py             # Entanglement, landscape, Stim QEC
│       └── pqc_demo.py             # Kyber/Dilithium demos
└── tests/
    └── test_workspace.py           # 6 unit tests (pytest)

frontend/
└── src/
    ├── components/workspace/        # Main workspace UI
    │   ├── WorkspacePage.tsx       # Shell: editor, timeline, panels
    │   ├── WorkspaceCircuitBuilder.tsx  # Editable circuit grid
    │   ├── WorkspaceInspectors.tsx      # State/docs/benchmarks
    │   └── WorkspaceAnalysisPanel.tsx   # Entanglement/landscape/QEC
    ├── lib/workspace/
    │   ├── pseudoParser.ts         # Frontend QPAL parser (mirrors backend)
    │   ├── programToCircuit.ts     # Parsed instructions → circuit grid
    │   ├── circuitToProgram.ts     # Circuit grid → QPAL pseudocode
    │   ├── api.ts                  # Fetch client for all endpoints
    │   └── types.ts                # Shared TypeScript view models
    ├── lib/quantum/
    │   ├── gates.ts                # Gate definitions (matrix + Bloch effect)
    │   ├── stateVector.ts          # Pure TS statevector simulator
    │   ├── qcEngine.ts             | Adapter for quantum-circuit npm lib
    │   └── presets.ts              # Pre-built circuits (Bell, GHZ, etc.)
    ├── store/
    │   ├── simStore.ts             # Zustand: engine, walkthrough, params
    │   └── circuitStore.ts         # Zustand: circuit grid state
    └── components/bloch/            # 3D Bloch sphere (R3F + Three.js)
```

## The Strict API Contract

All engines MUST return this exact JSON structure. The React Three.js visualizers will crash if violated:

```json
{
  "summary": { "qubits": [], "actors": [], "total_steps": 0, "measurements": 0 },
  "steps": [
    {
      "index": 0,
      "instruction": { "line": 1, "raw": "...", "opcode": "H", "args": [], "qubits": ["q0"], "category": "quantum" },
      "event": "...",
      "state": {
        "qubits": [],
        "actors": [],
        "bloch_vectors": [],
        "measurements": [],
        "transmissions": [],
        "statevector": []  // flat [re0, im0, re1, im1, ...]
      }
    }
  ],
  "final_state": { ... },
  "measurement_results": [],
  "warnings": []
}
```

See `backend/api/schemas/workspace.py` lines 1-200+ for the full Pydantic definitions.

## Parser Behavior Contract

The backend `parser.py` and frontend `pseudoParser.ts` must stay in sync. Key parsing rules:

- **Qubit IDs**: Must match `^q\d+$` (case-insensitive)
- **Actor names**: Must match `^[A-Za-z][A-Za-z0-9_-]*$`
- **Macros expand**:
  - `SUPERPOSE q` → `H q`
  - `ENTANGLE a b` → `H a` + `CNOT a b`
  - `BELL a b` → `INIT a 0` + `INIT b 0` + `H a` + `CNOT a b`
- **Unknown opcodes**: Raise `ValueError` (strict, no silent skip)
- **Auto-init**: Using a gate on an uninitialized qubit auto-initializes to |0⟩ with a warning

## Engine-Specific Notes

### Custom Engine (`executor.py`)
- Pure-Python symbolic runtime + `_MiniSV` statevector (≤12 qubits)
- Dual-track: symbolic state labels + statevector for accurate Bloch vectors
- Handles entanglement with simplified correlations (exact state fidelity not tracked)
- Measurement collapses both symbolic and statevector tracks

### OpenQASM Engine (`qasm_engine.py`)
- Eagerly imports Qiskit at module load — server startup absorbs cold-start cost
- Requires: `pip install qiskit qiskit-aer qiskit-qasm3-import`
- Uses `Statevector` for step snapshots + `AerSimulator` for shot counts
- If Qiskit missing, engine returns clear error message at request time

### QuNetSim Engine (`qunetsim_engine.py`)
- Intercepts QuNetSim host/monitor events to build step traces
- Requires: `pip install qunetsim`
- If missing, returns graceful error response

## Dependencies & Optional Packages

Core backend requires **only 4 packages**:
- `fastapi>=0.104.0`
- `uvicorn[standard]>=0.24.0`
- `pydantic>=2.5.0`
- `python-dotenv>=1.0.0`
- `PyJWT[crypto]>=2.10.1` (for auth)

**Optional analysis features** (all fall back gracefully if missing):
```bash
pip install toqito          # Entanglement: concurrence, negativity
pip install stim            # Stabilizer / QEC circuit simulation
pip install matplotlib      # Variational landscape PNG rendering
pip install liboqs-python   # Post-quantum crypto demos (Kyber, Dilithium)
```

Dev/test: `pytest>=7.0`, `requests>=2.28`

## Configuration & Environment

- **CORS**: Hardcoded in `main.py` to `["http://localhost:5173", "http://127.0.0.1:5173"]`. Update there if dev server uses different ports.
- **Port**: Backend reads `PORT` env var (default 8000). Frontend defaults to 5173 (Vite).
- **Auth**: `/api/workspace/*` endpoints require `require_authenticated_user` dependency. See `backend/api/deps/auth.py`. The `/catalog` endpoint is public.

## Coding Conventions

- **Frontend package management:** Always use `pnpm` in `frontend/`. Never use `npm` or `yarn`.
- **Backend:** Python 3.12+, FastAPI, Pydantic v2 models (strict validation)
- **Frontend:** React 18, TypeScript, Zustand for state, Three.js via R3F
- **Testing:** Backend uses pytest (no special fixtures yet). Frontend has no test runner.
- **Optional deps:** Missing packages cause graceful fallbacks — backend starts without them.
- **Error handling:** Engines must never crash; return `WorkspaceSimulateResponse` with warnings.

## Running Tests

All 6 tests in `backend/tests/test_workspace.py`:

```bash
cd backend && python -m pytest tests/ -v
```

Expected output (all passing):
```
test_workspace_bell_style_flow         PASSED
test_workspace_transport_and_intercept PASSED
test_bloch_bell_state_entangled        PASSED
test_bloch_pure_zero                   PASSED
test_bloch_plus_state                  PASSED
test_bloch_post_measurement_pure       PASSED
```

## Important Files to Read

- `backend/api/schemas/workspace.py` — The contract all engines must satisfy
- `backend/core/workspace/executor.py` — The reference implementation (custom engine)
- `backend/api/routes/workspace.py` — Routing and dispatch logic
- `frontend/src/lib/workspace/pseudoParser.ts` — Frontend parser (sync with backend)
- `docs/WORKSPACE_GUIDE.md` — Full pseudocode syntax and architecture notes

## Debugging Tips

**Frontend not rendering Bloch spheres?**
 → Check browser console for shape mismatches — the `WorkspaceSimulateResponse` schema likely violated.

**Backend returning 401 on /simulate?**
 → Auth dependency enabled. Either provide valid JWT or test with local auth disabled.

**OpenQASM engine error?**
 → Ensure `qiskit-qasm3-import` installed. Error message includes install instructions.

**Statevector looks wrong for entangled qubits?**
 → The `_MiniSV` and symbolic track intentionally simplify entanglement. Exact density matrices computed only when optional `toqito` installed (analysis endpoint).

**QuNetSim engine not working?**
 → Check `qunetsim_engine.py` import error at server startup. Install `qunetsim` or results will show error in `warnings` field.

## License

MIT
