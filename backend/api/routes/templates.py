from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

# ── Template data root ──────────────────────────────────────────────────────
# Resolves to backend/data/templates/{engine}/{template_id}.txt
TEMPLATE_ROOT = Path(__file__).resolve().parent.parent.parent / "data" / "templates"

VALID_ENGINES = {"custom", "openqasm", "qunetsim"}

router = APIRouter(
    prefix="/templates",
    tags=["templates"],
)


class TemplateCodeResponse(BaseModel):
    code: str


@router.get("/{engine}/{template_id}", response_model=TemplateCodeResponse)
async def get_template(engine: str, template_id: str) -> TemplateCodeResponse:
    """Return the raw source code for a given engine + template combination."""

    if engine not in VALID_ENGINES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown engine '{engine}'. Valid engines: {', '.join(sorted(VALID_ENGINES))}",
        )

    # Sanitise template_id to prevent path traversal
    safe_id = Path(template_id).name
    template_path = TEMPLATE_ROOT / engine / f"{safe_id}.txt"

    if not template_path.is_file():
        # Fallback: partial match by prefix (e.g. "deutsch" -> "deutsch_algorithm.txt")
        candidate_dir = TEMPLATE_ROOT / engine
        if candidate_dir.is_dir():
            candidates = sorted(candidate_dir.glob(f"{safe_id}*.txt"))
            if len(candidates) >= 1:
                template_path = candidates[0]

    if not template_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found for engine '{engine}'.",
        )

    code = template_path.read_text(encoding="utf-8")
    return TemplateCodeResponse(code=code)
