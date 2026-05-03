"""
OpenQASM 3.0 execution engine — Qiskit Statevector-based.

Imports Qiskit eagerly at module load so the server startup absorbs the
cold-start cost. If Qiskit is missing the module still loads and returns
a clear error at request time.
"""
from __future__ import annotations

import math
import traceback
from typing import Any

from fastapi.responses import JSONResponse

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
    from qiskit_aer.noise import NoiseModel, depolarizing_error, thermal_relaxation_error
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
    statevector_flat: list[float] = []
    for idx, qid in enumerate(qubit_ids):
        x, y, z, purity = _bloch_from_sv(sv_data, n_qubits, idx)
        bloch_vectors.append(WorkspaceBlochVector(qubit=qid, x=x, y=y, z=z, purity=purity))
        label = ("0" if z > 0.8 else "1" if z < -0.8 else
                 "+" if x > 0.8 else "-" if x < -0.8 else "mixed")
        qubit_states.append(WorkspaceQubitState(
            id=qid, initialized=True, state_label=label,
            superposition=(label not in {"0", "1"}),
        ))
    for amp in sv_data:
        c = complex(amp)
        statevector_flat.extend((float(c.real), float(c.imag)))
    return WorkspaceExecutionState(
        qubits=qubit_states, actors=[], bloch_vectors=bloch_vectors,
        measurements=[], transmissions=[], statevector=statevector_flat,
    )


def _basis_key(index: int, n_qubits: int) -> str:
    width = max(1, n_qubits)
    return format(index, f"0{width}b")


def _sv_to_complex_state(sv_data, n_qubits: int) -> dict[str, list[float]]:
    """Universal JSON state mapping: basis -> [real, imag]."""
    state: dict[str, list[float]] = {}
    for index, amp in enumerate(sv_data):
        c = complex(amp)
        state[_basis_key(index, n_qubits)] = [float(c.real), float(c.imag)]
    return state


def _sv_to_probability_state(sv_data, n_qubits: int) -> dict[str, float]:
    """Probability mapping used for final_state in Universal JSON."""
    final_state: dict[str, float] = {}
    for index, amp in enumerate(sv_data):
        c = complex(amp)
        probability = float((c.real * c.real) + (c.imag * c.imag))
        final_state[_basis_key(index, n_qubits)] = probability
    return final_state


def _error_response(engine: str, message: str) -> WorkspaceSimulateResponse:
    return WorkspaceSimulateResponse(
        engine=engine, summary=WorkspaceSummary(), steps=[],
        final_state=WorkspaceExecutionState(),
        measurement_results=[], warnings=[f"Engine error: {message}"],
    )


# ── Main engine ────────────────────────────────────────────────────────────────

def _build_simulator(compute: str | None = None, noise_model_arg: str | None = None,
                     warnings: list[str] | None = None) -> "AerSimulator":
    """Build an AerSimulator configured with the user's compute and noise preferences."""
    kwargs: dict[str, Any] = {}

    # ── Hardware routing ──
    if compute and compute.lower() == "gpu":
        try:
            from qiskit_aer import AerSimulator as _AerSimulator_check  # noqa: F811
            _AerSimulator_check(device="GPU").set_options()  # quick probe
            kwargs["device"] = "GPU"
        except Exception:
            if warnings is not None:
                warnings.append("GPU requested but not available — falling back to CPU")
            kwargs["device"] = "CPU"
    else:
        kwargs["device"] = "CPU"

    # ── Noise injection ──
    noise = None
    if noise_model_arg and noise_model_arg.lower() != "none":
        noise = _noise_model_from_label(noise_model_arg, warnings)
        if noise is not None:
            kwargs["noise_model"] = noise

    # Import is safe here — called only when _QISKIT_AVAILABLE is True
    from qiskit_aer import AerSimulator as _AerSimulator  # noqa: F811
    return _AerSimulator(**kwargs)


def _noise_model_from_label(label: str, warnings: list[str] | None = None):
    """Construct a basic depolarizing noise model from a string label."""
    from qiskit_aer.noise import NoiseModel, depolarizing_error, errors

    label_lower = label.lower()

    if label_lower in ("basic", "depolarizing", "noise"):
        # Simple 1-qubit and 2-qubit depolarizing noise
        noise_model = NoiseModel()

        # 1-qubit depolarizing error: 1% probability
        error_1q = depolarizing_error(0.01, 1)
        # 2-qubit depolarizing error: 2% probability
        error_2q = depolarizing_error(0.02, 2)

        # Apply to all standard gates (approximate coverage)
        for gate in ["u1", "u2", "u3", "rx", "ry", "rz", "h", "x", "y", "z", "s", "sdg", "t", "tdg"]:
            noise_model.add_quantum_error(error_1q, gate, [0])

        for gate in ["cx", "cz", "swap", "iswap"]:
            noise_model.add_all_qubit_quantum_error(error_2q, gate)

        if warnings is not None:
            warnings.append("Basic depolarizing noise model applied (1% 1q, 2% 2q)")

        return noise_model

    # Custom noise spec: JSON string {"error_rate": 0.015, "type": "depolarizing"}
    import json
    try:
        spec = json.loads(label)
        error_rate = spec.get("error_rate", 0.01)
        noise_model = NoiseModel()
        error_1q = depolarizing_error(error_rate, 1)
        error_2q = depolarizing_error(2 * error_rate, 2)

        for gate in ["u1", "u2", "u3", "rx", "ry", "rz", "h", "x", "y", "z", "s", "sdg", "t", "tdg"]:
            noise_model.add_quantum_error(error_1q, gate, [0])
        for gate in ["cx", "cz", "swap", "iswap"]:
            noise_model.add_all_qubit_quantum_error(error_2q, gate)

        if warnings is not None:
            warnings.append(f"Custom noise model: {error_rate:.1%} 1q, {2*error_rate:.1%} 2q depolarizing")

        return noise_model
    except (json.JSONDecodeError, TypeError, KeyError) as e:
        if warnings is not None:
            warnings.append(f"Could not parse custom noise_model: '{label}' ({e}), using no noise")
        return None


def execute_qasm(req: WorkspaceSimulateRequest):
    if not _QISKIT_AVAILABLE:
        return JSONResponse(
            status_code=200,
            content={
                "summary": "OpenQASM simulation failed.",
                "steps": [],
                "final_state": {},
                "warnings": [
                    f"Qiskit is not installed or failed to import: {_QISKIT_ERROR}. "
                    "Run: pip install qiskit qiskit-aer qiskit-qasm3-import"
                ],
            },
        )

    steps: list[WorkspaceExecutionStep] = []
    universal_steps: list[dict[str, Any]] = []
    warnings: list[str] = []

    try:
        # 1. Parse
        try:
            circuit = qasm3.loads(req.code)
        except Exception as e:
            return JSONResponse(
                status_code=200,
                content={
                    "summary": "OpenQASM simulation failed during parsing.",
                    "steps": [],
                    "final_state": {},
                    "warnings": [f"QASM parse error ({type(e).__name__}): {e!r}"],
                },
            )

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
                    qubits=q_labels, actors=[], category="quantum",
                ),
                event=f"Applied {label}.",
                state=_sv_to_state(list(sv.data), n_qubits)
            ))
            universal_steps.append(
                {
                    "description": f"Applied {label}.",
                    "state": {
                        "statevector": _sv_to_state(list(sv.data), n_qubits).statevector
                    },
                    "instruction": {
                        "opcode": gate_name
                    }
                }
            )

        # 3. Shot-based measurement
        sim = _build_simulator(req.compute, req.noise_model, warnings=warnings)
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
        universal_final_state = _sv_to_probability_state(list(final_sv.data), n_qubits)

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

        # Keep legacy workspace payload for backward compatibility while returning
        # universal step-wise complex amplitudes for the 3D visual adapter.
        workspace_payload = WorkspaceSimulateResponse(
            engine="openqasm",
            summary=WorkspaceSummary(
                qubits=[f"q{i}" for i in range(n_qubits)], actors=[],
                total_steps=len(steps), measurements=len(counts),
            ),
            steps=steps,
            final_state=final_state,
            measurement_results=measurement_results,
            warnings=warnings,
        ).model_dump()

        return JSONResponse(
            status_code=200,
            content=workspace_payload
        )

    except Exception as exc:
        return JSONResponse(
            status_code=200,
            content={
                "summary": "OpenQASM simulation failed.",
                "steps": [],
                "final_state": {},
                "warnings": [f"{exc}\n\n{traceback.format_exc()}"],
            },
        )
