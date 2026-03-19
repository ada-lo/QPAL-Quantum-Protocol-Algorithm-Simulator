import pytest
from api.schemas.request import SimulateRequest, GateOp
from core.engines.state_vector import StateVectorEngine

@pytest.mark.asyncio
async def test_bell_state():
    req = SimulateRequest(
        n_qubits=2,
        gates=[
            GateOp(gate_id="H", qubit=0, step=0),
            GateOp(gate_id="CNOT", qubit=0, step=1, target_qubit=1),
        ],
        shots=1024,
    )
    engine = StateVectorEngine()
    result = await engine.run(req)
    # Bell state should have ~50% |00⟩ and ~50% |11⟩
    assert abs(result.probabilities[0] - 0.5) < 0.05
    assert abs(result.probabilities[3] - 0.5) < 0.05
    assert result.fidelity == 1.0
