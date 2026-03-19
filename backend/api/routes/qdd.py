from fastapi import APIRouter
from api.schemas.request import SimulateRequest
from core.qdd.qdd_engine import QDDEngine
from core.qdd.qdd_serializer import serialize_qdd

router = APIRouter()

@router.post("/qdd/simulate")
async def qdd_simulate(req: SimulateRequest):
    engine = QDDEngine()
    result = await engine.run(req)
    return result
