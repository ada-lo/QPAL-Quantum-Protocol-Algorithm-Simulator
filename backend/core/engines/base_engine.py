"""
Base Quantum Engine — Universal Adapter Pattern.

Provides an abstract base class that all execution engines (Custom, OpenQASM,
QuNetSim) inherit from.  The concrete ``format_response`` method centralises
the algorithm-vs-protocol schema selection so every engine returns a strictly
validated ``WorkspaceSimulateResponse`` discriminated union.

Dual-Track Contract
-------------------
*   **Root level** — ``statevector`` and ``bloch_vectors`` represent the
    **final** simulation state.
*   **Per-step** — every ``WorkspaceExecutionStep.state`` contains the
    point-in-time snapshot (qubits, bloch_vectors, statevector) for that
    step, enabling the frontend timeline scrubber.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Union

from api.schemas.workspace import (
    WorkspaceActorState,
    WorkspaceAlgorithmResponse,
    WorkspaceBlochVector,
    WorkspaceExecutionState,
    WorkspaceExecutionStep,
    WorkspaceProtocolResponse,
    WorkspaceSimulateRequest,
    WorkspaceSummary,
    TransmissionRecord,
    MeasurementRecord,
)


class BaseQuantumEngine(ABC):
    """Abstract base for all QPAL execution engines.

    Subclasses must implement ``execute`` to run a simulation request.
    They should call ``self.format_response(...)`` to build the final
    validated response object.
    """

    @abstractmethod
    def execute(self, req: WorkspaceSimulateRequest):
        """Run a simulation and return a response.

        Concrete engines may return a ``WorkspaceSimulateResponse``
        directly or wrap it in a ``JSONResponse`` (e.g. OpenQASM).
        """
        ...

    # ── Dual-Track Payload Builder ─────────────────────────────────────────

    def format_response(
        self,
        *,
        summary: WorkspaceSummary,
        steps: list[WorkspaceExecutionStep],
        actors: list[WorkspaceActorState] | None = None,
        transmissions: list[TransmissionRecord] | None = None,
        measurements: list[MeasurementRecord] | None = None,
        statevector: list[float] | None = None,
        bloch_vectors: list[WorkspaceBlochVector] | None = None,
        shots: int | None = None,
        counts: dict[str, int] | None = None,
        warnings: list[str] | None = None,
        engine: str = "simplified-workspace-backend",
    ) -> Union[WorkspaceAlgorithmResponse, WorkspaceProtocolResponse]:
        """Build a validated discriminated-union response.

        Guarantees:
        1.  Every step in *steps* carries a ``state`` snapshot.  If a
            step arrives with ``state=None``, an empty
            ``WorkspaceExecutionState`` is injected as a fallback.
        2.  Root-level ``statevector`` and ``bloch_vectors`` reflect the
            **final** state.  When the caller omits them, they are
            inferred from the last step's snapshot.
        3.  The ``kind`` discriminant is set automatically: ``"protocol"``
            when *actors* or *transmissions* are present, otherwise
            ``"algorithm"``.
        """
        _actors = actors or []
        _transmissions = transmissions or []
        _measurements = measurements or []
        _shots = shots or 0
        _counts = counts or {}
        _warnings = warnings or []

        # ── Inject per-step state (dual-track guarantee) ───────────────
        for step in steps:
            if step.state is None:
                step.state = WorkspaceExecutionState()

        # ── Derive root-level final state from last step when omitted ──
        last_state = steps[-1].state if steps else None

        _statevector = statevector if statevector is not None else (
            list(last_state.statevector) if last_state else []
        )
        _bloch_vectors = bloch_vectors if bloch_vectors is not None else (
            list(last_state.bloch_vectors) if last_state else []
        )

        # ── Schema selection ───────────────────────────────────────────
        is_protocol = bool(_actors) or bool(_transmissions) or bool(_measurements)

        if is_protocol:
            return WorkspaceProtocolResponse(
                kind="protocol",
                engine=engine,
                summary=summary,
                steps=steps,
                actors=_actors,
                transmissions=_transmissions,
                measurements=_measurements,
                statevector=_statevector,
                bloch_vectors=_bloch_vectors,
                shots=_shots,
                counts=_counts,
                warnings=_warnings,
            )
        else:
            return WorkspaceAlgorithmResponse(
                kind="algorithm",
                engine=engine,
                summary=summary,
                steps=steps,
                statevector=_statevector,
                bloch_vectors=_bloch_vectors,
                shots=_shots,
                counts=_counts,
                warnings=_warnings,
            )

