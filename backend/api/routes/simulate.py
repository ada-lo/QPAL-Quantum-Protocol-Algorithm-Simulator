from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from api.schemas.request import SimulateRequest
from api.schemas.response import SimulateResponse
from core.engines.engine_factory import get_engine
import json

router = APIRouter()

@router.post("/simulate", response_model=SimulateResponse)
async def simulate(req: SimulateRequest):
    engine = get_engine(req.n_qubits)
    result = await engine.run(req)
    return result

@router.post("/simulate/stream")
async def simulate_stream(req: SimulateRequest):
    """SSE endpoint: streams step-by-step simulation results"""
    engine = get_engine(req.n_qubits)

    async def event_stream():
        async for step_data in engine.run_streaming(req):
            yield f"data: {json.dumps(step_data)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
