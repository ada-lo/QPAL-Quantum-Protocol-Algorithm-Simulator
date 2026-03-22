"""API routes for quantum algorithm endpoints"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from core.protocols.grover import run_grover
from core.protocols.shor import run_shor
from core.protocols.qft import run_qft
from core.protocols.qaoa import run_qaoa

router = APIRouter()


# ── Request models ──

class GroverRequest(BaseModel):
    n_qubits: int = Field(default=3, ge=2, le=6)
    target: int = Field(default=5, ge=0)

class ShorRequest(BaseModel):
    N: int = Field(default=15, ge=4)

class QFTRequest(BaseModel):
    n_qubits: int = Field(default=3, ge=2, le=6)
    input_state: int = Field(default=1, ge=0)

class QAOARequest(BaseModel):
    graph_edges: list[list[int]] = Field(default=[[0,1],[1,2],[2,3],[3,0],[0,2]])
    gamma: float = Field(default=0.8)
    beta: float = Field(default=0.4)
    p: int = Field(default=1, ge=1, le=5)
    shots: int = Field(default=2048, ge=100, le=10000)


# ── Endpoints ──

@router.post("/algorithms/grover")
async def api_grover(req: GroverRequest):
    return run_grover(n_qubits=req.n_qubits, target=req.target)

@router.post("/algorithms/shor")
async def api_shor(req: ShorRequest):
    return run_shor(N=req.N)

@router.post("/algorithms/qft")
async def api_qft(req: QFTRequest):
    return run_qft(n_qubits=req.n_qubits, input_state=req.input_state)

@router.post("/algorithms/qaoa")
async def api_qaoa(req: QAOARequest):
    return run_qaoa(
        graph_edges=req.graph_edges,
        gamma=req.gamma,
        beta=req.beta,
        p=req.p,
        shots=req.shots,
    )
