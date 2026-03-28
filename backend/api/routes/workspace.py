from __future__ import annotations

from fastapi import APIRouter

from api.schemas.workspace import (
    WorkspaceAnalysisRequest,
    WorkspaceAnalysisResponse,
    WorkspaceBenchmarkRequest,
    WorkspaceBenchmarkResponse,
    WorkspaceCatalogResponse,
    WorkspaceSimulateRequest,
    WorkspaceSimulateResponse,
)
from core.workspace import get_workspace_catalog, run_analysis, run_benchmarks
from core.workspace.executor import simulate_workspace
from core.workspace.parser import parse_pseudocode
from core.engines import execute_qasm, execute_qunetsim

router = APIRouter(prefix="/workspace", tags=["workspace"])


@router.get("/catalog", response_model=WorkspaceCatalogResponse)
async def workspace_catalog() -> WorkspaceCatalogResponse:
    return get_workspace_catalog()


@router.post("/simulate", response_model=WorkspaceSimulateResponse)
async def workspace_simulate(req: WorkspaceSimulateRequest) -> WorkspaceSimulateResponse:
    if req.engine == "custom":
        # Parse QPAL pseudocode into structured instructions, then execute
        instructions = parse_pseudocode(req.code)
        req.instructions = instructions
        return simulate_workspace(req)
    elif req.engine == "openqasm":
        return execute_qasm(req)
    else:
        return execute_qunetsim(req)



@router.post("/benchmarks", response_model=WorkspaceBenchmarkResponse)
async def workspace_benchmarks(req: WorkspaceBenchmarkRequest) -> WorkspaceBenchmarkResponse:
    return run_benchmarks(req)


@router.post("/analyze", response_model=WorkspaceAnalysisResponse)
async def workspace_analyze(req: WorkspaceAnalysisRequest) -> WorkspaceAnalysisResponse:
    return run_analysis(req)
