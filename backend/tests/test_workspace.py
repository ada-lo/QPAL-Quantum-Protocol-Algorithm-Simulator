from api.schemas.workspace import WorkspaceInstruction, WorkspaceSimulateRequest
from core.workspace.executor import simulate_workspace


def test_workspace_bell_style_flow():
    req = WorkspaceSimulateRequest(
        seed=7,
        instructions=[
            WorkspaceInstruction(line=1, raw="INIT q0", opcode="INIT", args=["q0"], qubits=["q0"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=2, raw="INIT q1", opcode="INIT", args=["q1"], qubits=["q1"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=3, raw="H q0", opcode="H", args=["q0"], qubits=["q0"], category="quantum", metadata={}),
            WorkspaceInstruction(line=4, raw="CNOT q0 q1", opcode="CNOT", args=["q0", "q1"], qubits=["q0", "q1"], category="quantum", metadata={}),
            WorkspaceInstruction(line=5, raw="MEASURE q0 BASIS Z", opcode="MEASURE", args=["q0", "BASIS", "Z"], qubits=["q0"], basis="Z", category="quantum", metadata={}),
        ],
    )

    result = simulate_workspace(req)

    assert result.summary.qubits == ["q0", "q1"]
    assert result.summary.measurements == 1
    assert len(result.steps) == 5
    assert result.measurement_results[0].qubit == "q0"
    assert result.final_state.qubits[0].last_operation in {"MEASURE[Z]", "COLLAPSE[Z]"}


def test_workspace_transport_and_intercept():
    req = WorkspaceSimulateRequest(
        seed=3,
        instructions=[
            WorkspaceInstruction(line=1, raw="ACTOR Alice", opcode="ACTOR", args=["Alice"], actors=["Alice"], category="actor", metadata={}),
            WorkspaceInstruction(line=2, raw="ACTOR Bob", opcode="ACTOR", args=["Bob"], actors=["Bob"], category="actor", metadata={}),
            WorkspaceInstruction(line=3, raw="ACTOR Eve", opcode="ACTOR", args=["Eve"], actors=["Eve"], category="actor", metadata={}),
            WorkspaceInstruction(line=4, raw="INIT q0 +", opcode="INIT", args=["q0", "+"], qubits=["q0"], category="quantum", metadata={"state": "+"}),
            WorkspaceInstruction(line=5, raw="ASSIGN q0 Alice", opcode="ASSIGN", args=["q0", "Alice"], qubits=["q0"], actors=["Alice"], category="actor", metadata={}),
            WorkspaceInstruction(line=6, raw="SEND q0 Alice Bob", opcode="SEND", args=["q0", "Alice", "Bob"], qubits=["q0"], actors=["Alice", "Bob"], category="transport", metadata={}),
            WorkspaceInstruction(line=7, raw="INTERCEPT q0 Eve", opcode="INTERCEPT", args=["q0", "Eve"], qubits=["q0"], actors=["Eve"], category="transport", metadata={}),
        ],
    )

    result = simulate_workspace(req)

    assert result.final_state.qubits[0].owner == "Eve"
    assert result.final_state.qubits[0].intercepted_by == "Eve"
    assert len(result.final_state.transmissions) == 2
    assert result.final_state.transmissions[-1].status == "intercepted"


def test_bloch_bell_state_entangled():
    """After H → CNOT, both qubits should be maximally entangled: purity ≈ 0."""
    req = WorkspaceSimulateRequest(
        seed=42,
        instructions=[
            WorkspaceInstruction(line=1, raw="INIT q0", opcode="INIT", args=["q0"], qubits=["q0"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=2, raw="INIT q1", opcode="INIT", args=["q1"], qubits=["q1"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=3, raw="H q0", opcode="H", args=["q0"], qubits=["q0"], category="quantum", metadata={}),
            WorkspaceInstruction(line=4, raw="CNOT q0 q1", opcode="CNOT", args=["q0", "q1"], qubits=["q0", "q1"], category="quantum", metadata={}),
        ],
    )
    result = simulate_workspace(req)
    bloch = {v.qubit: v for v in result.final_state.bloch_vectors}
    # Both qubits should have purity ≈ 0 (maximally mixed reduced state)
    for qid in ("q0", "q1"):
        assert abs(bloch[qid].x) < 0.05, f"{qid} x should be ~0"
        assert abs(bloch[qid].y) < 0.05, f"{qid} y should be ~0"
        assert abs(bloch[qid].z) < 0.05, f"{qid} z should be ~0"
        assert bloch[qid].purity < 0.05, f"{qid} purity should be ~0"


def test_bloch_pure_zero():
    """INIT |0⟩ should produce Bloch vector (0, 0, 1) with purity ≈ 1."""
    req = WorkspaceSimulateRequest(
        seed=1,
        instructions=[
            WorkspaceInstruction(line=1, raw="INIT q0", opcode="INIT", args=["q0"], qubits=["q0"], category="quantum", metadata={"state": "0"}),
        ],
    )
    result = simulate_workspace(req)
    v = result.final_state.bloch_vectors[0]
    assert abs(v.x) < 0.01
    assert abs(v.y) < 0.01
    assert abs(v.z - 1.0) < 0.01
    assert abs(v.purity - 1.0) < 0.01


def test_bloch_plus_state():
    """After H, qubit in |+⟩ should have Bloch vector ≈ (1, 0, 0)."""
    req = WorkspaceSimulateRequest(
        seed=2,
        instructions=[
            WorkspaceInstruction(line=1, raw="INIT q0", opcode="INIT", args=["q0"], qubits=["q0"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=2, raw="H q0", opcode="H", args=["q0"], qubits=["q0"], category="quantum", metadata={}),
        ],
    )
    result = simulate_workspace(req)
    v = result.final_state.bloch_vectors[0]
    assert abs(v.x - 1.0) < 0.01
    assert abs(v.y) < 0.01
    assert abs(v.z) < 0.01
    assert abs(v.purity - 1.0) < 0.01


def test_bloch_post_measurement_pure():
    """After MEASURE, qubit should collapse to a pure state (purity ≈ 1)."""
    req = WorkspaceSimulateRequest(
        seed=99,
        instructions=[
            WorkspaceInstruction(line=1, raw="INIT q0", opcode="INIT", args=["q0"], qubits=["q0"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=2, raw="H q0", opcode="H", args=["q0"], qubits=["q0"], category="quantum", metadata={}),
            WorkspaceInstruction(line=3, raw="MEASURE q0 BASIS Z", opcode="MEASURE", args=["q0", "BASIS", "Z"], qubits=["q0"], basis="Z", category="quantum", metadata={}),
        ],
    )
    result = simulate_workspace(req)
    v = result.final_state.bloch_vectors[0]
    # After measurement, purity should be ~1 (pure state)
    assert abs(v.purity - 1.0) < 0.01
    # z should be either +1 or -1
    assert abs(abs(v.z) - 1.0) < 0.01


def test_x_basis_measurement_collapses_correctly():
    """INIT |0⟩ → MEASURE BASIS X should collapse to |+⟩ or |−⟩, not stay on Z-axis.

    The Bloch vector after X-basis measurement must lie on the ±X axis,
    not the ±Z axis (which would indicate the bug where only Z-basis collapse was done).
    """
    req = WorkspaceSimulateRequest(
        seed=42,
        instructions=[
            WorkspaceInstruction(line=1, raw="INIT q0", opcode="INIT", args=["q0"], qubits=["q0"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=2, raw="MEASURE q0 BASIS X", opcode="MEASURE", args=["q0", "BASIS", "X"], qubits=["q0"], basis="X", category="quantum", metadata={}),
        ],
    )
    result = simulate_workspace(req)
    v = result.final_state.bloch_vectors[0]
    meas = result.measurement_results[0]
    # Outcome recorded correctly
    assert meas.basis == "X"
    assert meas.value in (0, 1)
    # After X-basis measurement the qubit should be on the ±X axis (purity ≈ 1)
    assert abs(v.purity - 1.0) < 0.01, f"Expected pure state, got purity={v.purity}"
    assert abs(abs(v.x) - 1.0) < 0.01, f"Expected |x|≈1 (X eigenstate), got x={v.x}"
    assert abs(v.z) < 0.01, f"Expected z≈0 (not Z eigenstate), got z={v.z}"


def test_intercept_syncs_statevector():
    """INIT |0⟩ → H → INTERCEPT should collapse to a Z-basis state in the statevector.

    Before the fix, INTERCEPT only updated the symbolic model but left _MiniSV
    unchanged, so the Bloch vector stayed at |+⟩ instead of collapsing.
    """
    req = WorkspaceSimulateRequest(
        seed=7,
        instructions=[
            WorkspaceInstruction(line=1, raw="INIT q0", opcode="INIT", args=["q0"], qubits=["q0"], category="quantum", metadata={"state": "0"}),
            WorkspaceInstruction(line=2, raw="H q0", opcode="H", args=["q0"], qubits=["q0"], category="quantum", metadata={}),
            WorkspaceInstruction(line=3, raw="INTERCEPT q0 Eve", opcode="INTERCEPT", args=["q0", "Eve"], qubits=["q0"], actors=["Eve"], category="transport", metadata={}),
        ],
    )
    result = simulate_workspace(req)
    v = result.final_state.bloch_vectors[0]
    # After interception of |+⟩ state, qubit should collapse to |0⟩ or |1⟩ in Z-basis
    assert abs(v.purity - 1.0) < 0.01, f"Expected pure state after intercept, got purity={v.purity}"
    assert abs(abs(v.z) - 1.0) < 0.01, f"Expected z=±1 (Z eigenstate), got z={v.z}"
    assert abs(v.x) < 0.01, f"Expected x≈0 after Z-collapse, got x={v.x}"


def test_analysis_endpoint():
    """POST /api/workspace/analyze should run and return valid data."""
    from core.workspace.analysis import run_analysis
    from api.schemas.workspace import WorkspaceAnalysisRequest

    req = WorkspaceAnalysisRequest(qubits=2, run_entanglement=True, run_landscape=True)
    result = run_analysis(req)
    # Entanglement metrics should always return purity
    assert result.entanglement is not None
    assert result.entanglement.purity == 1.0
    # Landscape should return grid data
    assert result.landscape is not None
    assert len(result.landscape.angles_x) > 0
    assert len(result.landscape.angles_y) > 0
    assert len(result.landscape.energies) > 0

