from pydantic import BaseModel
from typing import Optional

class ComplexNum(BaseModel):
    re: float
    im: float

class BlochVector(BaseModel):
    x: float
    y: float
    z: float

class QDDEdge(BaseModel):
    from_: str
    to: str
    branch: int
    weight: ComplexNum

class QDDNodeModel(BaseModel):
    id: str
    level: int
    label: str
    is_terminal: bool
    value: Optional[ComplexNum] = None

class QDDGraphModel(BaseModel):
    nodes: list[QDDNodeModel]
    edges: list[QDDEdge]
    n_qubits: int
    node_count: int

class SimulateResponse(BaseModel):
    state_vector: list[ComplexNum]
    probabilities: list[float]
    fidelity: float
    n_qubits: int
    shots: int
    counts: Optional[dict[str, int]] = None
    bloch_vectors: Optional[list[BlochVector]] = None
    qdd_graph: Optional[QDDGraphModel] = None
    engine_used: str = "statevector"

class NoiseSimResponse(SimulateResponse):
    noise_model: str
    t1_fidelity: Optional[float] = None
    t2_fidelity: Optional[float] = None
