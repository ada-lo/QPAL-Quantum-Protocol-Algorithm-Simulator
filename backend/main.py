import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes.simulate import router as sim_router
from api.routes.protocols import router as proto_router
from api.routes.noise import router as noise_router
from api.routes.qdd import router as qdd_router
from api.routes.health import router as health_router
from api.routes.workspace import router as workspace_router

load_dotenv()

app = FastAPI(
    title="Quantum Simulator API",
    description="GPU-accelerated quantum circuit simulation with noise modeling and QDD backend",
    version="0.1.0",
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(sim_router,   prefix="/api")
app.include_router(proto_router, prefix="/api")
app.include_router(noise_router, prefix="/api")
app.include_router(qdd_router,   prefix="/api")
app.include_router(workspace_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
