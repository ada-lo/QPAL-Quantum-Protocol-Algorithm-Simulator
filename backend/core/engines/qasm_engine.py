"""
OpenQASM 3.0 execution engine — Qiskit Statevector-based.

Imports Qiskit eagerly at module load so the server startup absorbs the
cold-start cost. If Qiskit is missing the module still loads and returns
a clear error at request time.
"""
from __future__ import annotations

import math
import traceback

from api.schemas.workspace import (
    MeasurementRecord,
    WorkspaceBlochVector,
    WorkspaceExecutionState,
    WorkspaceExecutionStep,
    WorkspaceInstruction,
    WorkspaceQubitState,
    WorkspaceSimulateRequest,
    WorkspaceSimulateResponse,
    WorkspaceSummary,
)

# ── Eagerly import Qiskit at module level ─────────────────────────────────────
_QISKIT_AVAILABLE = False
_QISKIT_ERROR = ""
try:
    from qiskit import qasm3, transpile
    from qiskit.quantum_info import Statevector
    from qiskit.circuit import QuantumCircuit
    from qiskit_aer import AerSimulator
    _QISKIT_AVAILABLE = True
except Exception as _import_err:
    _QISKIT_ERROR = str(_import_err)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _bloch_from_sv(sv_data, n_qubits: int, qubit_idx: int) -> tuple[float, float, float, float]:
    """Compute Bloch vector for a single qubit via partial trace."""
    dim = 1 << n_qubits
    r00 = r11 = r01_re = r01_im = 0.0
    for i in range(dim):
        if (i >> qubit_idx) & 1 == 0:
            j = i | (1 << qubit_idx)
            a, b = complex(sv_data[i]), complex(sv_data[j])
            r00 += abs(a) ** 2
            r11 += abs(b) ** 2
            prod = a * b.conjugate()
            r01_re += prod.real
            r01_im += prod.imag
    x = 2.0 * r01_re
    y = 2.0 * r01_im
    z = r00 - r11
    purity = min(math.sqrt(x * x + y * y + z * z), 1.0)
    return x, y, z, purity


def _sv_to_state(sv_data, n_qubits: int) -> WorkspaceExecutionState:
    qubit_ids = [f"q{i}" for i in range(n_qubits)]
    bloch_vectors = []
    qubit_states = []
    for idx, qid in enumerate(qubit_ids):
        x, y, z, purity = _bloch_from_sv(sv_data, n_qubits, idx)
        bloch_vectors.append(WorkspaceBlochVector(qubit=qid, x=x, y=y, z=z, purity=purity))
        label = ("0" if z > 0.8 else "1" if z < -0.8 else
                 "+" if x > 0.8 else "-" if x < -0.8 else "mixed")
        qubit_states.append(WorkspaceQubitState(
            id=qid, initialized=True, state_label=label,
            superposition=(label not in {"0", "1"}),
        ))
    return WorkspaceExecutionState(
        qubits=qubit_states, actors=[], bloch_vectors=bloch_vectors,
        measurements=[], transmissions=[],
    )


def _error_response(engine: str, message: str) -> WorkspaceSimulateResponse:
    return WorkspaceSimulateResponse(
        engine=engine, summary=WorkspaceSummary(), steps=[],
        final_state=WorkspaceExecutionState(),
        measurement_results=[], warnings=[f"Engine error: {message}"],
    )


# ── Main engine ────────────────────────────────────────────────────────────────

def execute_qasm(req: WorkspaceSimulateRequest) -> WorkspaceSimulateResponse:
    if not _QISKIT_AVAILABLE:
        return _error_response("openqasm",
            f"Qiskit is not installed or failed to import: {_QISKIT_ERROR}. "
            "Run: pip install qiskit qiskit-aer qiskit-qasm3-import")

    steps: list[WorkspaceExecutionStep] = []
    warnings: list[str] = []

    try:
        # 1. Parse
        try:
            circuit = qasm3.loads(req.code)
        except Exception as e:
            return _error_response("openqasm", f"QASM parse error ({type(e).__name__}): {e!r}")

        n_qubits = circuit.num_qubits
        gate_data = [i for i in circuit.data if i.operation.name not in ("barrier", "measure")]

        # 2. Statevector snapshots (fast — pure linear algebra, no simulator)
        running = QuantumCircuit(n_qubits)
        for step_i, instr in enumerate(gate_data):
            running.append(instr.operation, instr.qubits)
            sv = Statevector.from_instruction(running)

            gate_name = instr.operation.name.upper()
            q_labels = [f"q{circuit.find_bit(q).index}" for q in instr.qubits]
            label = f"{gate_name} {', '.join(q_labels)}"

            steps.append(WorkspaceExecutionStep(
                index=step_i,
                instruction=WorkspaceInstruction(
                    line=step_i + 1, raw=label, opcode=gate_name, args=q_labels,
                    qubits=[f"q{j}" for j in range(n_qubits)], actors=[], category="quantum",
                ),
                event=f"Applied {label}.",
                state=_sv_to_state(list(sv.data), n_qubits),
            ))

        # 3. Shot-based measurement
        sim = AerSimulator()
        meas_circuit = circuit.copy()
        if not any(i.operation.name == "measure" for i in circuit.data):
            meas_circuit.measure_all()
        counts = sim.run(transpile(meas_circuit, sim), shots=1024).result().get_counts()

        # 4. Final statevector
        gate_only = QuantumCircuit(n_qubits)
        for instr in gate_data:
            gate_only.append(instr.operation, instr.qubits)
        final_sv = Statevector.from_instruction(gate_only)
        final_state = _sv_to_state(list(final_sv.data), n_qubits)

        # 5. Measurement records
        measurement_results: list[MeasurementRecord] = []
        for bitstring in counts:
            flipped = bitstring[::-1].replace(" ", "")
            for bit_idx, bit_val in enumerate(flipped[:n_qubits]):
                measurement_results.append(MeasurementRecord(
                    qubit=f"q{bit_idx}", basis="Z", value=int(bit_val),
                    actor=None, step=len(steps),
                ))
            break

        return WorkspaceSimulateResponse(
            engine="openqasm",
            summary=WorkspaceSummary(
                qubits=[f"q{i}" for i in range(n_qubits)], actors=[],
                total_steps=len(steps), measurements=len(counts),
            ),
            steps=steps,
            final_state=final_state,
            measurement_results=measurement_results,
            warnings=warnings,
        )

    except Exception as exc:
        return _error_response("openqasm", f"{exc}\n\n{traceback.format_exc()}")
