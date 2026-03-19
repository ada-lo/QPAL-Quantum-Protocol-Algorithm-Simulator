from fastapi import APIRouter
from api.schemas.request import NoiseSimRequest
from api.schemas.response import NoiseSimResponse
from core.noise.noise_models import build_noise_model
from core.engines.state_vector import StateVectorEngine

router = APIRouter()

@router.post("/noise/simulate", response_model=NoiseSimResponse)
async def noise_simulate(req: NoiseSimRequest):
    noise_model = build_noise_model(req.model_id, req.params)
    engine = StateVectorEngine()
    result = await engine.run_with_noise(req, noise_model)
    return result
