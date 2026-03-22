"""API route for GHZ QDD demonstration (Gap 3 proof)"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from core.protocols.ghz import run_ghz

router = APIRouter()


class GHZRequest(BaseModel):
    n_qubits: int = Field(default=5, ge=2, le=20)


@router.post("/qdd/ghz")
async def api_ghz(req: GHZRequest):
    return run_ghz(n_qubits=req.n_qubits)
