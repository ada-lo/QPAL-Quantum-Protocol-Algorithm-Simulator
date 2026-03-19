from fastapi import APIRouter
from core.protocols.bb84 import run_bb84
from core.protocols.teleportation import run_teleportation
from core.protocols.superdense import run_superdense

router = APIRouter()

@router.post("/protocols/bb84")
async def bb84(n_bits: int = 20, eve_present: bool = False):
    return run_bb84(n_bits, eve_present)

@router.post("/protocols/teleportation")
async def teleportation(state_alpha: float = 0.707, state_beta: float = 0.707):
    return run_teleportation(state_alpha, state_beta)

@router.post("/protocols/superdense")
async def superdense(bit1: int = 0, bit2: int = 0):
    return run_superdense(bit1, bit2)
