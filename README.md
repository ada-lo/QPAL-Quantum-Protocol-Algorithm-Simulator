# Quantum Protocol & Algorithm Simulator

> A GPU-accelerated, noise-aware quantum simulator with multi-party protocol visualization.  
> Solves **Gap 2** (decoherence/noise) and **Gap 3** (scalability beyond 6 qubits via QDD).

---

## Research Gaps Addressed

| Gap | Description | Implementation |
|-----|-------------|----------------|
| Gap 2 | No visual simulator shows realistic noise/decoherence | Qiskit Aer noise models → live Bloch sphere shrinkage + fidelity decay |
| Gap 3 | No simulator scales beyond ~6 qubits with visual coherence | mqt-ddsim QDD backend → 20+ qubit simulation + live QDD graph |

---

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| Circuit Builder | 🔲 | Drag-and-drop gate editor, 1–20 qubits |
| Bloch Sphere | 🔲 | Three.js WebGL per-qubit state visualization |
| Protocol Animator | 🔲 | BB84, Quantum Teleportation, Superdense Coding |
| Algorithm Simulator | 🔲 | Grover, Shor, QAOA step-by-step |
| Noise Dashboard | 🔲 | Gap 2 — decoherence, fidelity, noise model selector |
| QDD Graph View | 🔲 | Gap 3 — live quantum decision diagram |

---

## Tech Stack

### Frontend
- React 18 + Vite
- Three.js (WebGL Bloch spheres)
- D3.js (amplitude/phase bars, QDD graph)
- Zustand (state management)
- TailwindCSS
- React Flow (circuit builder canvas)

### Backend
- Python 3.12
- FastAPI (REST + SSE streaming)
- cuQuantum (NVIDIA GPU state-vector sim)
- mqt-ddsim (Quantum Decision Diagram sim — Gap 3)
- Qiskit Aer (noise modeling — Gap 2)
- NumPy / SciPy
- Uvicorn + Gunicorn

### Infrastructure
- Docker + Docker Compose
- Vercel (frontend deploy)
- Railway / Render (backend GPU instance)
- NVIDIA RTX 4050 (local dev)

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- CUDA 12+ (for GPU acceleration)
- Docker (optional, for full stack)

### Local Development

```bash

# 2. Start backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Start frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Docker (Full Stack)

```bash
docker-compose up --build
# Frontend → http://localhost:5173
# Backend  → http://localhost:8000
# API docs → http://localhost:8000/docs
```

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/simulate` | POST | Run circuit simulation (state-vector or QDD) |
| `/api/simulate/stream` | POST (SSE) | Stream step-by-step gate-by-gate results |
| `/api/noise/simulate` | POST | Run noisy simulation with Qiskit Aer |
| `/api/protocols/bb84` | POST | Run BB84 protocol with custom params |
| `/api/protocols/teleportation` | POST | Quantum teleportation protocol |
| `/api/protocols/superdense` | POST | Superdense coding protocol |
| `/api/qdd/simulate` | POST | QDD simulation for large circuits |
| `/api/algorithms/grover` | POST | Grover's search algorithm *(planned)* |
| `/api/algorithms/shor` | POST | Shor's factoring *(planned)* |
| `/api/algorithms/qaoa` | POST | QAOA optimization *(planned)* |

---

## Project Structure

```
quantum-simulator/
├── frontend/          # React + Vite app
├── backend/           # FastAPI + Python
├── docker-compose.yml
├── .env.example
└── README.md
```

See `frontend/README.md` and `backend/README.md` for module-level docs.