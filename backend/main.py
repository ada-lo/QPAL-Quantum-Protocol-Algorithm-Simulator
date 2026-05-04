import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes.workspace import router as workspace_router
from api.routes.templates import router as templates_router

load_dotenv()


def _normalize_origin(origin: str) -> str:
    origin = origin.strip()
    if origin.endswith("/") and "://" in origin:
        return origin.rstrip("/")
    return origin


def _parse_cors_origins(raw_origins: str | None) -> list[str]:
    configured = raw_origins or "http://localhost:5173,http://127.0.0.1:5173"
    origins: list[str] = []
    for origin in configured.split(","):
        normalized = _normalize_origin(origin)
        if normalized and normalized not in origins:
            origins.append(normalized)
    return origins

app = FastAPI(
    title="QPAL Workspace API",
    description="Backend for the QPAL quantum experimentation workspace — pseudocode parsing, step-by-step simulation, and benchmarking for quantum algorithms and communication protocols.",
    version="0.2.0",
)

origins = _parse_cors_origins(os.getenv("CORS_ORIGINS"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(workspace_router, prefix="/api")
app.include_router(templates_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
