from fastapi import APIRouter
from utils.gpu_utils import get_gpu_info

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "gpu": get_gpu_info()}
