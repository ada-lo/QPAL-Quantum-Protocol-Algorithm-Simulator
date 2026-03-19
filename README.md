# Quantum Protocol & Algorithm Simulator

A noise-aware, scalable quantum simulator addressing two research gaps:

- **Gap 2** — Real-time noise/decoherence visualization (Qiskit Aer noise models → Bloch sphere shrinkage, fidelity decay)
- **Gap 3** — Scalable simulation beyond 6 qubits (mqt-ddsim QDD backend, GPU-accelerated)

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Three.js (WebGL) + D3.js |
| State | Zustand |
| Backend | FastAPI + Python 3.12 |
| Sim engine (≤6 qubits) | Qiskit Aer (GPU state vector) |
| Sim engine (7–30 qubits) | mqt-ddsim (Quantum Decision Diagrams) |
| Noise modeling | Qiskit Aer noise models |
| GPU | NVIDIA RTX 4050 / cuQuantum |
| Deploy | Vercel (frontend) + Railway (backend) |

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Protocols
- BB84 Quantum Key Distribution (with Eve eavesdropping detection)
- Quantum Teleportation (step-by-step animated)
- Superdense Coding

## Algorithms
- Grover's Search
- Shor's Factoring (small N)
- QAOA (coming next module)

## Research Context
Based on literature review of:
- Bley et al. (2024) — Dimensional Circle Notation
- arXiv:2603.07942 (2025) — Local/nonlocal DOF separation
- Cadden-Zimansky et al. (2024) — Geometric qubit visualization
