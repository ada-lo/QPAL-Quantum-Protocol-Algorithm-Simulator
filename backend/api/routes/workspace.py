from __future__ import annotations

from urllib.parse import quote_plus
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

from fastapi import APIRouter, Depends, HTTPException

from api.deps.auth import require_authenticated_user
from api.schemas.workspace import (
    ArxivPaper,
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

router = APIRouter(
    prefix="/workspace",
    tags=["workspace"],
)


@router.get("/catalog", response_model=WorkspaceCatalogResponse)
async def workspace_catalog() -> WorkspaceCatalogResponse:
    return get_workspace_catalog()


@router.get("/papers", response_model=list[ArxivPaper])
async def workspace_papers(query: str) -> list[ArxivPaper]:
    normalized_query = query.strip()
    if not normalized_query:
        raise HTTPException(status_code=400, detail="Query is required.")

    request = Request(
        f"https://export.arxiv.org/api/query?search_query=all:{quote_plus(normalized_query)}&start=0&max_results=5&sortBy=relevance",
        headers={
            "User-Agent": "QPAL/1.0 (research papers proxy)",
            "Accept": "application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        },
    )

    try:
        with urlopen(request, timeout=12) as response:
            payload = response.read()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to fetch arXiv papers: {exc}") from exc

    try:
        root = ET.fromstring(payload)
    except ET.ParseError as exc:
        raise HTTPException(status_code=502, detail="Unable to parse arXiv response.") from exc

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    papers: list[ArxivPaper] = []

    for index, entry in enumerate(root.findall("atom:entry", ns)):
        paper_id = entry.findtext("atom:id", default="", namespaces=ns).strip()
        title = " ".join(entry.findtext("atom:title", default="", namespaces=ns).split())
        summary = " ".join(entry.findtext("atom:summary", default="", namespaces=ns).split())
        published = entry.findtext("atom:published", default="", namespaces=ns).strip()
        authors = [
            (author.findtext("atom:name", default="", namespaces=ns) or "Unknown").strip()
            for author in entry.findall("atom:author", ns)
        ]
        link = paper_id
        for link_node in entry.findall("atom:link", ns):
            if link_node.attrib.get("rel") == "alternate" and link_node.attrib.get("href"):
                link = link_node.attrib["href"]
                break

        papers.append(
            ArxivPaper(
                id=paper_id or f"{normalized_query}-{index}",
                title=title,
                authors=authors,
                published=published,
                summary=summary,
                link=link,
            )
        )

    return papers


@router.post("/simulate", response_model=WorkspaceSimulateResponse, dependencies=[Depends(require_authenticated_user)])
async def workspace_simulate(req: WorkspaceSimulateRequest) -> WorkspaceSimulateResponse:
    if req.engine == "custom":
        # Parse QPAL pseudocode into structured instructions, then execute
        try:
            instructions = parse_pseudocode(req.code)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        req.instructions = instructions
        return simulate_workspace(req)
    elif req.engine == "openqasm":
        return execute_qasm(req)
    else:
        return execute_qunetsim(req)



@router.post("/benchmarks", response_model=WorkspaceBenchmarkResponse, dependencies=[Depends(require_authenticated_user)])
async def workspace_benchmarks(req: WorkspaceBenchmarkRequest) -> WorkspaceBenchmarkResponse:
    return run_benchmarks(req)


@router.post("/analyze", response_model=WorkspaceAnalysisResponse, dependencies=[Depends(require_authenticated_user)])
async def workspace_analyze(req: WorkspaceAnalysisRequest) -> WorkspaceAnalysisResponse:
    return run_analysis(req)
