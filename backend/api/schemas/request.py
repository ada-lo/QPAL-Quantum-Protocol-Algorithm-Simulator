from pydantic import BaseModel, Field
from typing import Optional, Literal

class GateOp(BaseModel):
    gate_id: str
    qubit: int
    step: int
    target_qubit: Optional[int] = None
    control_qubit: Optional[int] = None

class SimulateRequest(BaseModel):
    n_qubits: int = Field(default=3, ge=1, le=30)
    gates: list[GateOp] = Field(default_factory=list)
    noise_model: str = "ideal"
    noise_params: dict = Field(default_factory=dict)
    shots: int = Field(default=1024, ge=1, le=100000)
    return_qdd: bool = False

class NoiseSimRequest(SimulateRequest):
    model_config = {"protected_namespaces": ()}
    model_id: str
    params: dict = Field(default_factory=dict)
