from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class WorkspaceInstruction(BaseModel):
    line: int = Field(..., ge=1)
    raw: str
    opcode: str
    args: list[str] = Field(default_factory=list)
    qubits: list[str] = Field(default_factory=list)
    actors: list[str] = Field(default_factory=list)
    basis: Literal["X", "Z"] | None = None
    label: str | None = None
    category: Literal["quantum", "transport", "actor", "annotation", "macro"] = "quantum"
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkspaceSimulateRequest(BaseModel):
    # Dual-engine path (new): raw code + engine type
    code: str = ""
    engine: Literal["custom", "openqasm", "qunetsim"] = "custom"
    noise_model: str | None = None
    compute: str | None = None
    seed: int | None = None
    # Legacy pseudocode path: structured instructions (used by executor.py & tests)
    instructions: list[WorkspaceInstruction] = Field(default_factory=list)


class MeasurementRecord(BaseModel):
    qubit: str
    basis: Literal["X", "Z"]
    value: int
    actor: str | None = None
    step: int


class TransmissionRecord(BaseModel):
    qubit: str
    from_actor: str | None = None
    to_actor: str | None = None
    status: Literal["sent", "intercepted", "received"]
    intercepted_by: str | None = None
    step: int


class WorkspaceBlochVector(BaseModel):
    qubit: str
    x: float
    y: float
    z: float
    purity: float = 1.0


class WorkspaceQubitState(BaseModel):
    id: str
    initialized: bool
    state_label: str
    superposition: bool
    owner: str | None = None
    location: str | None = None
    entangled_with: list[str] = Field(default_factory=list)
    intercepted_by: str | None = None
    last_operation: str | None = None


class WorkspaceActorState(BaseModel):
    name: str
    owned_qubits: list[str] = Field(default_factory=list)


class WorkspaceExecutionState(BaseModel):
    qubits: list[WorkspaceQubitState] = Field(default_factory=list)
    actors: list[WorkspaceActorState] = Field(default_factory=list)
    bloch_vectors: list[WorkspaceBlochVector] = Field(default_factory=list)
    measurements: list[MeasurementRecord] = Field(default_factory=list)
    transmissions: list[TransmissionRecord] = Field(default_factory=list)


class WorkspaceExecutionStep(BaseModel):
    index: int
    instruction: WorkspaceInstruction
    event: str
    state: WorkspaceExecutionState


class WorkspaceSummary(BaseModel):
    qubits: list[str] = Field(default_factory=list)
    actors: list[str] = Field(default_factory=list)
    total_steps: int = 0
    measurements: int = 0


class WorkspaceSimulateResponse(BaseModel):
    engine: str = "simplified-workspace-backend"
    summary: WorkspaceSummary
    steps: list[WorkspaceExecutionStep] = Field(default_factory=list)
    final_state: WorkspaceExecutionState
    measurement_results: list[MeasurementRecord] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class WorkspaceSyntaxItem(BaseModel):
    syntax: str
    description: str
    category: str
    example: str | None = None
    expands_to: list[str] | None = None


class WorkspaceTemplateParameter(BaseModel):
    name: str
    label: str
    type: str
    default: Any


class WorkspaceTemplate(BaseModel):
    id: str
    title: str
    kind: Literal["protocol", "algorithm", "circuit", "benchmark"]
    description: str
    tags: list[str] = Field(default_factory=list)
    parameters: list[WorkspaceTemplateParameter] | None = None
    code: str


class WorkspaceBenchmarkProfile(BaseModel):
    id: str
    label: str
    description: str
    qubits: int
    family: str


class WorkspaceCatalogResponse(BaseModel):
    syntax: list[WorkspaceSyntaxItem] = Field(default_factory=list)
    templates: list[WorkspaceTemplate] = Field(default_factory=list)
    benchmarks: list[WorkspaceBenchmarkProfile] = Field(default_factory=list)
    architecture_notes: list[str] = Field(default_factory=list)


class WorkspaceBenchmarkRequest(BaseModel):
    benchmark_ids: list[str] | None = None
    repetitions: int = Field(default=1, ge=1, le=5)
    prefer_gpu: bool = True


class WorkspaceSystemCapabilities(BaseModel):
    cpu: str
    cpu_cores: int
    gpu_available: bool
    gpu_name: str | None = None
    gpu_memory: str | None = None
    gpu_driver: str | None = None


class WorkspaceBenchmarkResult(BaseModel):
    id: str
    label: str
    family: str
    qubits: int
    depth: int
    gate_count: int
    duration_ms: float
    engine_used: str
    gpu_used: bool
    notes: str | None = None


class WorkspaceBenchmarkResponse(BaseModel):
    capabilities: WorkspaceSystemCapabilities
    results: list[WorkspaceBenchmarkResult] = Field(default_factory=list)
    used_gpu: bool = False
    reference_note: str


# ── Analysis schemas ────────────────────────────────────────────────────────

class EntanglementMetrics(BaseModel):
    concurrence: float | None = None
    negativity: float | None = None
    purity: float = 1.0
    is_entangled: bool | None = None
    engine: str = "builtin"


class LandscapeData(BaseModel):
    angles_x: list[float] = Field(default_factory=list)
    angles_y: list[float] = Field(default_factory=list)
    energies: list[list[float]] = Field(default_factory=list)
    circuit_type: str = "vqe"
    preset_label: str | None = None
    plot_base64: str | None = None


class StimResult(BaseModel):
    circuit_type: str
    qubits: int
    noise_p: float = 0.0
    shots: int = 1000
    outcome_counts: dict[str, int] = Field(default_factory=dict)
    fidelity: float | None = None
    engine: str = "stim"


class WorkspaceAnalysisRequest(BaseModel):
    qubits: int | None = 2
    run_entanglement: bool = False
    run_landscape: bool = False
    run_stim: bool = False
    landscape_circuit: str | None = "vqe"
    landscape_grid: int | None = 20
    stim_circuit: str | None = "ghz"
    stim_noise: float | None = 0.0
    stim_shots: int | None = 1000
    circuit_gates: list[dict[str, Any]] | None = None
    preset_label: str | None = None


class WorkspaceAnalysisResponse(BaseModel):
    entanglement: EntanglementMetrics | None = None
    landscape: LandscapeData | None = None
    stim: StimResult | None = None

