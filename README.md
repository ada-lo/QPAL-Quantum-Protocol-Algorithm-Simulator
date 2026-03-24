# QPAL — Quantum Protocol & Algorithm Lab

<div align="center">

**An interactive workspace for understanding, simulating, and visualizing quantum algorithms and communication protocols.**

![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)
![React 18](https://img.shields.io/badge/frontend-React_18-61DAFB?logo=react&logoColor=black)
![License MIT](https://img.shields.io/badge/license-MIT-green)

</div>

---

## What Is QPAL?

QPAL is a full-stack educational platform for quantum computing. You write quantum programs in a **pseudocode language**, execute them on a built-in statevector simulator, and inspect the results through interactive visualizations — all in your browser.

### Key Features

| Feature | Description |
|---|---|
| 🧪 **Pseudocode Editor** | Write and edit quantum protocols in a purpose-built pseudocode language with syntax highlighting |
| ⚙️ **Step-by-Step Simulator** | Execute programs instruction-by-instruction with full state tracing |
| 🔮 **3D Bloch Spheres** | Visualize qubit states as vectors on the Bloch sphere (supports mixed/entangled states) |
| 📊 **Benchmarks** | 8 built-in benchmark families (GHZ, QFT, Grover, QAOA, VQE, QPE, W-State, Deutsch-Jozsa) — zero external dependencies |
| 🔗 **Entanglement Analysis** | Compute purity, concurrence, and negativity metrics (optional `toqito` integration) |
| 🛡️ **QEC Simulation** | Stabilizer-circuit noise simulation via `stim` (optional) |
| 📐 **Variational Landscape** | Sweep VQE/QAOA parameters and visualize energy surfaces (optional `matplotlib`) |
| 🔐 **Post-Quantum Crypto** | Kyber KEM and Dilithium signature demos (optional `liboqs-python`) |
| ⚡ **Quirk Integration** | Embedded Quirk drag-and-drop circuit editor |
| 📚 **9 Algorithm Templates** | Bell pair, BB84, teleportation, superdense coding, Grover, QFT, QAOA, VQE, QPE |
| 🎭 **Protocol Animators** | Animated multi-party visualizations for BB84, B92, E91, and QEC protocols |

---

## Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** and **pnpm** (or npm)

### 1. Clone the Repository

```bash
git clone https://github.com/ada-lo/QPAL-Quantum-Protocol-Algorithm-Simulator.git
cd QPAL-Quantum-Protocol-Algorithm-Simulator
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Activate the virtual environment
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend starts at **http://localhost:8000**.

### 3. Frontend Setup

```bash
cd frontend
pnpm install       # or: npm install
pnpm run dev       # or: npm run dev
```

The frontend starts at **http://localhost:5173**.

### 4. Shortcut (from repo root)

```bash
npm run dev:backend     # starts uvicorn on :8000
npm run dev:frontend    # starts Vite dev server on :5173
npm run test:backend    # runs pytest
npm run build           # production frontend build
```

---

## Optional Dependencies

The core QPAL experience requires **only 4 Python packages** (FastAPI, uvicorn, Pydantic, python-dotenv). All benchmarks and simulations run out of the box with zero additional installs.

For advanced analysis features, you can optionally install:

```bash
pip install toqito          # Entanglement metrics (concurrence, negativity)
pip install stim            # Stabilizer / QEC circuit simulation
pip install matplotlib      # Variational landscape PNG rendering
pip install liboqs-python   # Post-quantum cryptography demos (Kyber, Dilithium)
```

> **Note:** On Windows, `stim` may require a C++ build toolchain (Visual Studio Build Tools). If the install fails, the analysis module gracefully falls back to the built-in purity-only engine.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspace/catalog` | List algorithm templates, benchmark profiles, syntax docs |
| `POST` | `/api/workspace/simulate` | Execute pseudocode and return step-by-step state traces |
| `POST` | `/api/workspace/benchmarks` | Run performance benchmarks (8 circuit families) |
| `POST` | `/api/workspace/analyze` | Entanglement metrics, variational landscape, Stim QEC |
| `GET` | `/health` | Backend health check |

---

## Project Structure

```text
QPAL-Quantum-Protocol-Algorithm-Simulator/
├── backend/
│   ├── main.py                          # FastAPI application entry point
│   ├── requirements.txt                 # Python dependencies
│   ├── api/
│   │   ├── routes/workspace.py          # API route handlers
│   │   └── schemas/workspace.py         # Pydantic request / response models
│   ├── core/workspace/
│   │   ├── executor.py                  # Pseudocode interpreter + _MiniSV simulator
│   │   ├── catalog.py                   # Algorithm templates + benchmark profiles
│   │   ├── benchmarks.py                # Zero-dependency benchmark engine
│   │   ├── analysis.py                  # Entanglement, landscape, Stim analysis
│   │   └── pqc_demo.py                  # Post-quantum cryptography demos
│   └── tests/
│       └── test_workspace.py            # Backend unit tests
│
├── frontend/
│   ├── src/
│   │   ├── components/workspace/        # Main workspace UI panels
│   │   ├── components/protocols/        # Protocol animators (BB84, B92, E91)
│   │   ├── components/bloch/            # 3D Bloch sphere renderer
│   │   ├── lib/quantum/                 # Gates, simulator, qcEngine adapter
│   │   └── lib/workspace/              # Parser, API client, shared types
│   └── package.json
│
├── docs/
│   └── WORKSPACE_GUIDE.md               # Full pseudocode syntax & architecture guide
│
└── package.json                         # Root scripts (dev:frontend, dev:backend, etc.)
```

---

## Built-in Algorithm Templates

| Template | Type | Difficulty | Source |
|---|---|---|---|
| Bell Pair Starter | Protocol | Beginner | — |
| BB84 With Eve | Protocol | Intermediate | — |
| Teleportation Walkthrough | Protocol | Intermediate | — |
| Superdense Coding | Protocol | Intermediate | — |
| Grover's Search | Algorithm | Beginner | PennyLane |
| Quantum Fourier Transform | Algorithm | Intermediate | PennyLane |
| QAOA MaxCut | Algorithm | Intermediate | PennyLane |
| VQE Ansatz (H₂) | Algorithm | Intermediate | PennyLane |
| Quantum Phase Estimation | Algorithm | Advanced | PennyLane |

---

## Benchmark Families

All benchmarks run on the **built-in _MiniSV pure-Python statevector engine** — no external quantum computing packages required.

| Family | Qubits | Category | Inspired By |
|---|---|---|---|
| GHZ | 8 | Communication | MQT Bench |
| QFT | 10 | Transform | MQT Bench |
| Grover | 8 | Search | MQT Bench |
| QAOA | 10 | Optimization | MQT Bench |
| VQE | 8 | Variational | PennyLane |
| QPE | 8 | Estimation | PennyLane |
| W-State | 10 | Communication | — |
| Deutsch-Jozsa | 10 | Decision | — |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12+, FastAPI, Pydantic, uvicorn |
| Simulation | `_MiniSV` (pure Python statevector, ≤12 qubits) |
| Frontend | React 18, TypeScript, Vite |
| 3D Rendering | Three.js via React Three Fiber |
| State Management | Zustand |
| UI Components | Radix UI, Framer Motion, Lucide icons |
| Graphs | D3.js, XY Flow (React Flow) |
| Frontend Sim | `quantum-circuit` (npm), `quantum-tensors` (npm) |

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

All 6 tests should pass:

```
test_workspace_bell_style_flow         PASSED
test_workspace_transport_and_intercept PASSED
test_bloch_bell_state_entangled        PASSED
test_bloch_pure_zero                   PASSED
test_bloch_plus_state                  PASSED
test_bloch_post_measurement_pure       PASSED
```

---

## Documentation

See [`docs/WORKSPACE_GUIDE.md`](docs/WORKSPACE_GUIDE.md) for the full pseudocode syntax reference, backend execution model, parser behavior, and architecture notes.

---

## License

MIT
