from __future__ import annotations

from api.schemas.workspace import (
    WorkspaceBenchmarkProfile,
    WorkspaceCatalogResponse,
    WorkspaceSyntaxItem,
    WorkspaceTemplate,
)


SYNTAX_REFERENCE = [
    WorkspaceSyntaxItem(
        syntax="INIT q0",
        description="Initialize a qubit in the |0> state.",
        category="quantum",
        example="INIT q0",
    ),
    WorkspaceSyntaxItem(
        syntax="INIT q1 1",
        description="Initialize a qubit in the |1> state.",
        category="quantum",
        example="INIT q1 1",
    ),
    WorkspaceSyntaxItem(
        syntax="INIT q2 +",
        description="Initialize a qubit in the |+> state and mark it as a superposition state.",
        category="quantum",
        example="INIT q2 +",
    ),
    WorkspaceSyntaxItem(
        syntax="RESET q0",
        description="Clear a qubit back to |0> and remove entanglement links.",
        category="quantum",
        example="RESET q0",
    ),
    WorkspaceSyntaxItem(
        syntax="H q0",
        description="Toggle a qubit between the Z basis and the X basis using the simplified Hadamard rule.",
        category="quantum",
        example="H q0",
    ),
    WorkspaceSyntaxItem(
        syntax="X q0",
        description="Flip a qubit in the computational basis.",
        category="quantum",
        example="X q0",
    ),
    WorkspaceSyntaxItem(
        syntax="Y q0",
        description="Apply a simplified Y rotation using X plus phase behavior.",
        category="quantum",
        example="Y q0",
    ),
    WorkspaceSyntaxItem(
        syntax="Z q0",
        description="Flip the X-basis phase marker between |+> and |->.",
        category="quantum",
        example="Z q0",
    ),
    WorkspaceSyntaxItem(
        syntax="S q0",
        description="Apply a simplified quarter-phase update to a qubit.",
        category="quantum",
        example="S q0",
    ),
    WorkspaceSyntaxItem(
        syntax="T q0",
        description="Apply a simplified eighth-turn phase update to a qubit.",
        category="quantum",
        example="T q0",
    ),
    WorkspaceSyntaxItem(
        syntax="SDG q0",
        description="Apply the inverse simplified S phase rule.",
        category="quantum",
        example="SDG q0",
    ),
    WorkspaceSyntaxItem(
        syntax="TDG q0",
        description="Apply the inverse simplified T phase rule.",
        category="quantum",
        example="TDG q0",
    ),
    WorkspaceSyntaxItem(
        syntax="SX q0",
        description="Apply a simplified square-root-X style superposition update.",
        category="quantum",
        example="SX q0",
    ),
    WorkspaceSyntaxItem(
        syntax="RX q0 1.5708",
        description="Apply a simplified X-axis rotation with a numeric angle in radians.",
        category="quantum",
        example="RX q0 1.5708",
    ),
    WorkspaceSyntaxItem(
        syntax="RY q0 1.5708",
        description="Apply a simplified Y-axis rotation with a numeric angle in radians.",
        category="quantum",
        example="RY q0 1.5708",
    ),
    WorkspaceSyntaxItem(
        syntax="RZ q0 1.5708",
        description="Apply a simplified Z-axis rotation with a numeric angle in radians.",
        category="quantum",
        example="RZ q0 1.5708",
    ),
    WorkspaceSyntaxItem(
        syntax="CNOT q0 q1",
        description="Flip the target when the control is |1>, or create a basic entanglement link when a superposition is involved.",
        category="quantum",
        example="CNOT q0 q1",
    ),
    WorkspaceSyntaxItem(
        syntax="SWAP q0 q1",
        description="Swap the simplified runtime states of two qubits.",
        category="quantum",
        example="SWAP q0 q1",
    ),
    WorkspaceSyntaxItem(
        syntax="CZ q0 q1",
        description="Apply a simplified controlled phase update or correlation link.",
        category="quantum",
        example="CZ q0 q1",
    ),
    WorkspaceSyntaxItem(
        syntax="TOFFOLI q0 q1 q2",
        description="Apply a simplified doubly-controlled X gate using two controls and one target.",
        category="quantum",
        example="TOFFOLI q0 q1 q2",
    ),
    WorkspaceSyntaxItem(
        syntax="MEASURE q0 [BASIS X]",
        description="Measure a qubit in the X basis. The bracket form and the plain BASIS form are both accepted.",
        category="quantum",
        example="MEASURE q0 BASIS X",
    ),
    WorkspaceSyntaxItem(
        syntax="MEASURE q0 [BASIS Z]",
        description="Measure a qubit in the Z basis. If omitted, Z is used by default.",
        category="quantum",
        example="MEASURE q0",
    ),
    WorkspaceSyntaxItem(
        syntax="ACTOR Alice",
        description="Register an actor lane for ownership and transport events.",
        category="actor",
        example="ACTOR Alice",
    ),
    WorkspaceSyntaxItem(
        syntax="ASSIGN q0 Alice",
        description="Assign a qubit to an actor.",
        category="actor",
        example="ASSIGN q0 Alice",
    ),
    WorkspaceSyntaxItem(
        syntax="SEND q0 Alice Bob",
        description="Move a qubit from one actor to another and record a transport event.",
        category="transport",
        example="SEND q0 Alice Bob",
    ),
    WorkspaceSyntaxItem(
        syntax="INTERCEPT q0 Eve",
        description="Intercept a qubit with a third actor. In the simplified engine this performs a hidden Z-basis disturbance when needed.",
        category="transport",
        example="INTERCEPT q0 Eve",
    ),
    WorkspaceSyntaxItem(
        syntax="LABEL BellPair",
        description="Add a timeline marker without changing state.",
        category="annotation",
        example="LABEL BellPair",
    ),
    WorkspaceSyntaxItem(
        syntax="NOTE share entanglement before sending",
        description="Store an inline note in the execution trace.",
        category="annotation",
        example="NOTE Bob receives the second qubit here",
    ),
    WorkspaceSyntaxItem(
        syntax="WAIT 1",
        description="Insert a visual spacer step.",
        category="annotation",
        example="WAIT 1",
    ),
    WorkspaceSyntaxItem(
        syntax="BARRIER",
        description="Insert a barrier marker in the circuit timeline.",
        category="annotation",
        example="BARRIER",
    ),
    WorkspaceSyntaxItem(
        syntax="SUPERPOSE q0",
        description="Macro form that expands to a Hadamard gate.",
        category="macro",
        example="SUPERPOSE q0",
        expands_to=["H q0"],
    ),
    WorkspaceSyntaxItem(
        syntax="BELL q0 q1",
        description="Macro form that prepares a Bell-pair-style entanglement pattern.",
        category="macro",
        example="BELL q0 q1",
        expands_to=["INIT q0", "INIT q1", "H q0", "CNOT q0 q1"],
    ),
]


TEMPLATES = [
    WorkspaceTemplate(
        id="bell_pair",
        title="Bell Pair Starter",
        kind="circuit",
        description="Create a Bell pair and inspect the circuit, Bloch vectors, and measurement history.",
        tags=["entanglement", "starter"],
        code="\n".join(
            [
                "LABEL Bell Pair",
                "INIT q0",
                "INIT q1",
                "H q0",
                "CNOT q0 q1",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="bb84_eavesdrop",
        title="BB84 With Eve",
        kind="protocol",
        description="Model preparation, sending, interception, and measurement with actors.",
        tags=["bb84", "qkd", "actors"],
        code="\n".join(
            [
                "ACTOR Alice",
                "ACTOR Bob",
                "ACTOR Eve",
                "LABEL Prepare photon",
                "INIT q0 +",
                "ASSIGN q0 Alice",
                "SEND q0 Alice Bob",
                "INTERCEPT q0 Eve",
                "SEND q0 Eve Bob",
                "MEASURE q0 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="teleportation_simplified",
        title="Teleportation Walkthrough",
        kind="protocol",
        description="A simplified teleportation-style flow driven entirely by pseudocode.",
        tags=["teleportation", "entanglement"],
        code="\n".join(
            [
                "ACTOR Alice",
                "ACTOR Bob",
                "INIT q0 +",
                "INIT q1",
                "INIT q2",
                "ASSIGN q0 Alice",
                "ASSIGN q1 Alice",
                "ASSIGN q2 Bob",
                "LABEL Share entanglement",
                "H q1",
                "CNOT q1 q2",
                "LABEL Alice encodes the Bell measurement",
                "CNOT q0 q1",
                "H q0",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
                "SEND q1 Alice Bob",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="superdense_simplified",
        title="Superdense Coding",
        kind="protocol",
        description="Prepare a Bell pair, encode with X and Z, and send one qubit.",
        tags=["superdense", "communication"],
        code="\n".join(
            [
                "ACTOR Alice",
                "ACTOR Bob",
                "INIT q0",
                "INIT q1",
                "ASSIGN q0 Alice",
                "ASSIGN q1 Bob",
                "BELL q0 q1",
                "LABEL Encode message 11",
                "Z q0",
                "X q0",
                "SEND q0 Alice Bob",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="grover_search",
        title="Grover's Search",
        kind="algorithm",
        description=(
            "Grover's search algorithm on 2 qubits — marks |11⟩ as the solution, "
            "then amplifies it with one oracle+diffusion iteration.  "
            "Derived from PennyLane's GroverOperator decomposition "
            "(pennylane/templates/subroutines/grover.py)."
        ),
        tags=["grover", "search", "difficulty:beginner", "ref:pennylane"],
        code="\n".join(
            [
                "NOTE Grover's search on 2 qubits — marks |11⟩",
                "NOTE Ref: PennyLane GroverOperator",
                "",
                "INIT q0",
                "INIT q1",
                "",
                "LABEL Uniform superposition",
                "H q0",
                "H q1",
                "",
                "LABEL Oracle — phase-flip |11⟩",
                "CZ q0 q1",
                "",
                "LABEL Diffusion operator (2|s⟩⟨s| − I)",
                "H q0",
                "H q1",
                "X q0",
                "X q1",
                "CZ q0 q1",
                "X q0",
                "X q1",
                "H q0",
                "H q1",
                "",
                "LABEL Readout",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="qft_3qubit",
        title="Quantum Fourier Transform",
        kind="algorithm",
        description=(
            "3-qubit QFT using the standard decomposition: Hadamard, "
            "controlled-rotation (via CNOT+RZ), and SWAP bit-reversal.  "
            "Derived from PennyLane's QFT template "
            "(pennylane/templates/subroutines/qft.py)."
        ),
        tags=["qft", "transform", "difficulty:intermediate", "ref:pennylane"],
        code="\n".join(
            [
                "NOTE 3-qubit Quantum Fourier Transform",
                "NOTE Ref: PennyLane QFT",
                "",
                "INIT q0 1",
                "INIT q1",
                "INIT q2",
                "",
                "LABEL QFT — qubit 0",
                "H q0",
                "NOTE Controlled-R2(π/2) on q0, controlled by q1",
                "CNOT q1 q0",
                "RZ q0 -1.5708",
                "CNOT q1 q0",
                "RZ q0 1.5708",
                "NOTE Controlled-R3(π/4) on q0, controlled by q2",
                "CNOT q2 q0",
                "RZ q0 -0.7854",
                "CNOT q2 q0",
                "RZ q0 0.7854",
                "",
                "LABEL QFT — qubit 1",
                "H q1",
                "NOTE Controlled-R2(π/2) on q1, controlled by q2",
                "CNOT q2 q1",
                "RZ q1 -1.5708",
                "CNOT q2 q1",
                "RZ q1 1.5708",
                "",
                "LABEL QFT — qubit 2",
                "H q2",
                "",
                "LABEL Bit-reversal SWAP",
                "SWAP q0 q2",
                "",
                "LABEL Readout",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
                "MEASURE q2 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="qaoa_maxcut",
        title="QAOA MaxCut",
        kind="algorithm",
        description=(
            "One-round QAOA for MaxCut on a 3-node triangle graph.  "
            "The cost layer uses ZZ-coupling (CNOT → RZ → CNOT per edge), "
            "and the mixer layer uses RX on each qubit.  "
            "Derived from PennyLane's QAOA recipe "
            "(pennylane.qaoa.cost and mixer layers)."
        ),
        tags=["qaoa", "optimization", "maxcut", "difficulty:intermediate", "ref:pennylane"],
        code="\n".join(
            [
                "NOTE QAOA MaxCut — 3-node triangle graph",
                "NOTE Ref: PennyLane QAOA",
                "",
                "INIT q0",
                "INIT q1",
                "INIT q2",
                "",
                "LABEL Initial superposition",
                "H q0",
                "H q1",
                "H q2",
                "",
                "LABEL Cost layer — ZZ coupling (γ = 0.8)",
                "NOTE Edge (q0, q1)",
                "CNOT q0 q1",
                "RZ q1 1.6",
                "CNOT q0 q1",
                "NOTE Edge (q1, q2)",
                "CNOT q1 q2",
                "RZ q2 1.6",
                "CNOT q1 q2",
                "NOTE Edge (q0, q2)",
                "CNOT q0 q2",
                "RZ q2 1.6",
                "CNOT q0 q2",
                "",
                "LABEL Mixer layer — RX (β = 0.5)",
                "RX q0 1.0",
                "RX q1 1.0",
                "RX q2 1.0",
                "",
                "LABEL Readout",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
                "MEASURE q2 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="vqe_h2",
        title="VQE Ansatz (H₂ molecule)",
        kind="algorithm",
        description=(
            "A hardware-efficient VQE ansatz for the H₂ molecule Hamiltonian.  "
            "Two-qubit circuit with RY → CNOT → RY layers at pre-optimized angles.  "
            "In a real VQE loop, a classical optimizer would tune these angles.  "
            "Derived from PennyLane's VQE tutorial."
        ),
        tags=["vqe", "chemistry", "variational", "difficulty:intermediate", "ref:pennylane"],
        code="\n".join(
            [
                "NOTE VQE ansatz for H₂ (hardware-efficient)",
                "NOTE Ref: PennyLane VQE tutorial",
                "",
                "INIT q0",
                "INIT q1",
                "",
                "LABEL Ansatz layer 1 — single-qubit rotations",
                "RY q0 0.5",
                "RY q1 -1.2",
                "",
                "LABEL Entangling layer",
                "CNOT q0 q1",
                "",
                "LABEL Ansatz layer 2 — single-qubit rotations",
                "RY q0 0.8",
                "RY q1 0.3",
                "",
                "LABEL Measure ⟨Z₀Z₁⟩ term",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
                "",
                "NOTE In a full VQE:",
                "NOTE   1. A classical optimizer adjusts the RY angles",
                "NOTE   2. Multiple Pauli terms are measured (ZZ, ZI, IZ, XX)",
                "NOTE   3. The expectation values are summed to get ⟨H⟩",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="qpe_simple",
        title="Quantum Phase Estimation",
        kind="algorithm",
        description=(
            "Phase estimation with 1 target qubit and 2 estimation qubits.  "
            "Estimates the phase of a T gate (θ = π/4 → binary 0.001).  "
            "Uses controlled-U powers and an inverse QFT.  "
            "Derived from PennyLane's QuantumPhaseEstimation template "
            "(pennylane/templates/subroutines/qpe.py)."
        ),
        tags=["qpe", "phase-estimation", "difficulty:advanced", "ref:pennylane"],
        code="\n".join(
            [
                "NOTE Quantum Phase Estimation",
                "NOTE Target: T gate (phase θ = π/4)",
                "NOTE Estimation qubits: q0 (MSB), q1 (LSB)",
                "NOTE Target qubit: q2",
                "NOTE Ref: PennyLane QuantumPhaseEstimation",
                "",
                "INIT q0",
                "INIT q1",
                "INIT q2",
                "",
                "LABEL Prepare eigenstate |1⟩ on target",
                "X q2",
                "",
                "LABEL Hadamard estimation qubits",
                "H q0",
                "H q1",
                "",
                "LABEL Controlled-U¹ (T gate) on target, controlled by q1",
                "CNOT q1 q2",
                "RZ q2 -0.7854",
                "CNOT q1 q2",
                "RZ q2 0.7854",
                "",
                "LABEL Controlled-U² (T² = S gate) on target, controlled by q0",
                "CNOT q0 q2",
                "RZ q2 -1.5708",
                "CNOT q0 q2",
                "RZ q2 1.5708",
                "",
                "LABEL Inverse QFT on estimation qubits",
                "SWAP q0 q1",
                "H q0",
                "CNOT q1 q0",
                "RZ q0 0.7854",
                "CNOT q1 q0",
                "RZ q0 -0.7854",
                "H q1",
                "",
                "LABEL Readout — phase encoded in estimation qubits",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
            ]
        ),
    ),
]


BENCHMARKS = [
    WorkspaceBenchmarkProfile(
        id="ghz",
        label="GHZ",
        description="Entanglement fan-out benchmark inspired by MQT Bench GHZ-style families.",
        qubits=8,
        family="communication",
    ),
    WorkspaceBenchmarkProfile(
        id="qft",
        label="QFT",
        description="Fourier-style benchmark inspired by the MQT Bench QFT circuit family.",
        qubits=10,
        family="transform",
    ),
    WorkspaceBenchmarkProfile(
        id="grover",
        label="Grover",
        description="Search-style benchmark inspired by the MQT Bench Grover family.",
        qubits=8,
        family="search",
    ),
    WorkspaceBenchmarkProfile(
        id="qaoa",
        label="QAOA",
        description="Optimization-style benchmark inspired by the MQT Bench QAOA family.",
        qubits=10,
        family="optimization",
    ),
    WorkspaceBenchmarkProfile(
        id="vqe",
        label="VQE",
        description="Variational quantum eigensolver ansatz benchmark derived from PennyLane VQE demos.",
        qubits=8,
        family="variational",
    ),
    WorkspaceBenchmarkProfile(
        id="qpe",
        label="QPE",
        description="Quantum Phase Estimation benchmark derived from PennyLane QPE template.",
        qubits=8,
        family="estimation",
    ),
    WorkspaceBenchmarkProfile(
        id="wstate",
        label="W-State",
        description="W-state preparation benchmark — single-excitation superposition.",
        qubits=10,
        family="communication",
    ),
    WorkspaceBenchmarkProfile(
        id="dj",
        label="Deutsch-Jozsa",
        description="Deutsch-Jozsa algorithm benchmark with balanced oracle.",
        qubits=10,
        family="decision",
    ),
]


def list_benchmark_profiles() -> list[WorkspaceBenchmarkProfile]:
    return BENCHMARKS


def get_workspace_catalog() -> WorkspaceCatalogResponse:
    return WorkspaceCatalogResponse(
        syntax=SYNTAX_REFERENCE,
        templates=TEMPLATES,
        benchmarks=BENCHMARKS,
        architecture_notes=[
            "Frontend parsing is kept in TypeScript so the editor can flag syntax errors before a network call.",
            "Backend execution owns the runtime state machine, measurements, transport events, and benchmark orchestration.",
            "Benchmarks run on the built-in _MiniSV pure-Python statevector engine — zero external dependencies required.",
            "Benchmark circuit families are inspired by MQT Bench and PennyLane templates.",
        ],
    )
