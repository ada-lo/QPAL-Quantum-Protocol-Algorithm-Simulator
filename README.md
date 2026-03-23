# QPAL — Quantum Protocol & Algorithm Lab

An interactive workspace for understanding, analyzing, and experimenting with quantum algorithms and communication protocols.

QPAL is built for researchers, developers, and advanced learners who want to:

- **Define** protocols and algorithms in a pseudocode-first language
- **Simulate** execution with step-by-step state tracing
- **Inspect** qubit state, measurement outcomes, and protocol flow at every step
- **Analyze** actor ownership, transport events, interception, and noise behavior
- **Benchmark** performance across workloads (GHZ, QFT, Grover, QAOA-style circuits)
- **Visualize** behavior through 3D Bloch spheres, protocol animators, and circuit timelines

## Architecture

```text
frontend/
  src/components/workspace/   main workspace UI
  src/components/protocols/   protocol animators (BB84, B92, E91, QEC)
  src/components/learning/    3D studio inspector
  src/lib/workspace/          parser, API client, shared types
  src/lib/quantum/            gates, simulator, pseudocode catalog
  src/store/                  workspace state management

backend/
  api/routes/workspace.py     workspace endpoints
  api/schemas/workspace.py    workspace request/response models
  core/workspace/             catalog, executor, benchmarks

docs/
  WORKSPACE_GUIDE.md          syntax, architecture, and usage guide
```

## Workspace Flow

1. **Load or write** a protocol/algorithm using the built-in pseudocode language
2. **Run** the backend executor to simulate step-by-step
3. **Step through** the execution timeline — inspect state, measurements, and transport events
4. **Switch views** between the circuit editor and pseudo language tabs
5. **Inspect** via the right-pane tabs: 3D Studio, State, Bloch, Benchmarks, Docs

## Main API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/workspace/catalog` | List available templates, benchmarks, syntax docs |
| `POST /api/workspace/simulate` | Execute a pseudocode program and return step traces |
| `POST /api/workspace/benchmarks` | Run performance benchmarks |
| `GET /health` | Backend health check |

## Run Locally

### Quick Start (from repo root)

```bash
npm run dev:frontend    # starts Vite dev server on :5173
npm run dev:backend     # starts uvicorn on :8000
npm run test:backend    # runs pytest
npm run build           # production frontend build
```

### Manual Setup

**Backend:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> **Optional:** For the `/api/workspace/benchmarks` endpoint, install `qiskit` and `qiskit-aer`:
> ```bash
> pip install qiskit qiskit-aer
> ```
> The rest of the API works without them.

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000`

## Documentation

See `docs/WORKSPACE_GUIDE.md` for pseudocode syntax, parser behavior, backend execution model, UI architecture, and benchmark design.

