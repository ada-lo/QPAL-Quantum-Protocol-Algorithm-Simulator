# QPAL — Quantum Protocol & Algorithm Simulator

A React + Vite frontend and FastAPI backend for a pseudocode-first quantum protocol workspace.

The app now centers on one integrated simulator page:

- No sidebar-driven protocol/algorithm demos
- Editable custom pseudo language
- Local TypeScript parser with structured JSON output
- Backend-owned step-by-step execution state
- Circuit timeline, Bloch inspector, docs, and benchmarks in one place
- Light and dark themes

## What Changed

- The old routed lesson sidebar was removed from the active app shell.
- Protocols and algorithms are now loaded as integrated pseudocode templates.
- The frontend parses pseudocode and immediately shows clean instruction objects.
- The backend executes the simplified quantum and actor/transport logic.
- The right inspector pane is resizable.
- Bloch spheres now support zoom through OrbitControls.
- Backend benchmarks now expose machine-aware CPU/GPU timing for GHZ, QFT, Grover, and QAOA-style workloads.

## Project Structure

```text
frontend/
  src/components/workspace/   integrated workspace UI
  src/lib/workspace/          parser, API client, shared types
backend/
  api/routes/workspace.py     workspace endpoints
  api/schemas/workspace.py    workspace request/response models
  core/workspace/             catalog, executor, benchmarks
docs/
  WORKSPACE_GUIDE.md          syntax, architecture, and usage guide
```

## Main Endpoints

- `GET /api/workspace/catalog`
- `POST /api/workspace/simulate`
- `POST /api/workspace/benchmarks`
- `GET /health`
- Existing simulation, noise, protocol, and QDD routes are still present for the older backend features.

## Run Locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:8000`

## Verification

Verified during this refactor:

- `frontend`: `npm run build`
- `backend`: `python -m compileall .`
- `backend`: `.venv\Scripts\python.exe -m pytest backend\tests\test_simulate.py backend\tests\test_noise.py backend\tests\test_workspace.py`

## Documentation

See `docs/WORKSPACE_GUIDE.md` for:

- pseudo language syntax
- parser behavior
- backend execution model
- UI architecture
- benchmark design
