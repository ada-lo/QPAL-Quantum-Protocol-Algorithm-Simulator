"""
QuNetSim execution engine.

The original implementation executed user-supplied Python directly inside the
backend process. That is not safe to expose from an authenticated API, so the
engine now returns a schema-valid warning response until a real sandboxed
runtime is introduced.
"""
from __future__ import annotations

from api.schemas.workspace import WorkspaceSimulateRequest, WorkspaceSummary
from core.engines.base_engine import BaseQuantumEngine


class QuNetSimEngine(BaseQuantumEngine):
    """QuNetSim network protocol execution engine."""

    def execute(self, req: WorkspaceSimulateRequest):
        return _execute_qunetsim_impl(self, req)


_engine = QuNetSimEngine()


def execute_qunetsim(req: WorkspaceSimulateRequest):
    """Module-level convenience — delegates to QuNetSimEngine."""
    return _engine.execute(req)


def _execute_qunetsim_impl(engine: QuNetSimEngine, req: WorkspaceSimulateRequest):
    """Return a safe, schema-valid response while QuNetSim execution is disabled."""
    return engine.format_response(
        engine="qunetsim",
        summary=WorkspaceSummary(qubits=[], actors=[], total_steps=0, measurements=0),
        steps=[],
        statevector=[],
        bloch_vectors=[],
        warnings=[
            "QuNetSim execution is disabled in the backend because running arbitrary Python code in-process is not safe. "
            "Use the custom or OpenQASM engines until a real sandboxed QuNetSim runtime is added."
        ],
    )
