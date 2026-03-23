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
        id="grover_starter",
        title="Grover-Inspired Search",
        kind="algorithm",
        description="A simplified search walk that still shows superposition, control logic, and readout.",
        tags=["grover", "search"],
        code="\n".join(
            [
                "INIT q0",
                "INIT q1",
                "INIT q2",
                "LABEL Uniform superposition",
                "H q0",
                "H q1",
                "LABEL Simplified oracle",
                "X q1",
                "CNOT q0 q2",
                "CNOT q1 q2",
                "LABEL Readout",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
                "MEASURE q2 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="qft_signal",
        title="QFT Signal Sketch",
        kind="algorithm",
        description="A compact signal-style circuit to study basis changes and transport between steps.",
        tags=["qft", "signal"],
        code="\n".join(
            [
                "INIT q0 1",
                "INIT q1",
                "INIT q2",
                "LABEL Phase mixing",
                "H q0",
                "CNOT q0 q1",
                "H q1",
                "CNOT q1 q2",
                "H q2",
                "MEASURE q0 BASIS X",
                "MEASURE q1 BASIS X",
                "MEASURE q2 BASIS Z",
            ]
        ),
    ),
    WorkspaceTemplate(
        id="qaoa_round",
        title="QAOA Round Sketch",
        kind="algorithm",
        description="A one-round QAOA-style layer with mixer and cost intuition.",
        tags=["qaoa", "optimization"],
        code="\n".join(
            [
                "INIT q0",
                "INIT q1",
                "INIT q2",
                "LABEL Mixer",
                "H q0",
                "H q1",
                "H q2",
                "LABEL Cost coupling",
                "CNOT q0 q1",
                "CNOT q1 q2",
                "LABEL Readout",
                "MEASURE q0 BASIS Z",
                "MEASURE q1 BASIS Z",
                "MEASURE q2 BASIS Z",
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
            "The simulation engine is intentionally simplified: it tracks superposition, entanglement links, and probabilistic measurement without full state-vector math.",
            "Benchmark circuits are generated on the backend and timed on the local machine so CPU and GPU availability can influence execution.",
        ],
    )
