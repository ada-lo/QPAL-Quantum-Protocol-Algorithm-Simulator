"""
OpenQASM 3.0 execution engine — Qiskit Statevector-based.

Imports Qiskit eagerly at module load so the server startup absorbs the
cold-start cost. If Qiskit is missing the module still loads and returns
a schema-valid warning response at request time.
"""
from __future__ import annotations

import math
import traceback
from typing import Any

from api.schemas.workspace import (
    MeasurementRecord,
    WorkspaceBlochVector,
    WorkspaceExecutionState,
    WorkspaceExecutionStep,
    WorkspaceInstruction,
    WorkspaceQubitState,
    WorkspaceSimulateRequest,
    WorkspaceSummary,
)
from core.engines.base_engine import BaseQuantumEngine

_QISKIT_AVAILABLE = False
_QISKIT_ERROR = ""
try:
    from qiskit import qasm3, transpile
    from qiskit.circuit import QuantumCircuit
    from qiskit.quantum_info import Statevector
    _QISKIT_AVAILABLE = True
except Exception as _import_err:
    _QISKIT_ERROR = str(_import_err)


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


def _sv_to_state(
    sv_data,
    n_qubits: int,
    *,
    last_ops: dict[str, str] | None = None,
    measurements: list[MeasurementRecord] | None = None,
) -> WorkspaceExecutionState:
    qubit_ids = [f"q{i}" for i in range(n_qubits)]
    bloch_vectors = []
    qubit_states = []
    statevector_flat: list[float] = []
    _last_ops = last_ops or {}
    for idx, qid in enumerate(qubit_ids):
        x, y, z, purity = _bloch_from_sv(sv_data, n_qubits, idx)
        bloch_vectors.append(WorkspaceBlochVector(qubit=qid, x=x, y=y, z=z, purity=purity))
        label = (
            "0" if z > 0.8 else
            "1" if z < -0.8 else
            "+" if x > 0.8 else
            "-" if x < -0.8 else
            "mixed"
        )
        qubit_states.append(
            WorkspaceQubitState(
                id=qid,
                initialized=True,
                state_label=label,
                superposition=(label not in {"0", "1"}),
                last_operation=_last_ops.get(qid),
            )
        )
    for amp in sv_data:
        c = complex(amp)
        statevector_flat.extend((float(c.real), float(c.imag)))
    return WorkspaceExecutionState(
        qubits=qubit_states,
        actors=[],
        bloch_vectors=bloch_vectors,
        measurements=list(measurements) if measurements else [],
        transmissions=[],
        statevector=statevector_flat,
    )


class QASMEngine(BaseQuantumEngine):
    """OpenQASM 3.0 execution engine — Qiskit Statevector-based."""

    def execute(self, req: WorkspaceSimulateRequest):
        return _execute_qasm_impl(self, req)


def _build_simulator(
    compute: str | None = None,
    noise_model_arg: str | None = None,
    warnings: list[str] | None = None,
):
    """Build an AerSimulator configured with the user's compute and noise preferences."""
    kwargs: dict[str, Any] = {}

    if compute and compute.lower() == "gpu":
        try:
            from qiskit_aer import AerSimulator as _AerSimulator_check

            _AerSimulator_check(device="GPU").set_options()
            kwargs["device"] = "GPU"
        except Exception:
            if warnings is not None:
                warnings.append("GPU requested but not available — falling back to CPU")
            kwargs["device"] = "CPU"
    else:
        kwargs["device"] = "CPU"

    noise = None
    if noise_model_arg and noise_model_arg.lower() != "none":
        noise = _noise_model_from_label(noise_model_arg, warnings)
        if noise is not None:
            kwargs["noise_model"] = noise

    from qiskit_aer import AerSimulator

    return AerSimulator(**kwargs)


def _noise_model_from_label(label: str, warnings: list[str] | None = None):
    """Construct a basic depolarizing noise model from a string label."""
    import json

    from qiskit_aer.noise import NoiseModel, depolarizing_error

    def build_depolarizing_noise_model(error_rate_1q: float, error_rate_2q: float, note: str):
        noise_model = NoiseModel()
        error_1q = depolarizing_error(error_rate_1q, 1)
        error_2q = depolarizing_error(error_rate_2q, 2)

        for gate in ["u1", "u2", "u3", "rx", "ry", "rz", "h", "x", "y", "z", "s", "sdg", "t", "tdg"]:
            noise_model.add_quantum_error(error_1q, gate, [0])
        for gate in ["cx", "cz", "swap", "iswap"]:
            noise_model.add_all_qubit_quantum_error(error_2q, gate)

        if warnings is not None:
            warnings.append(note)
        return noise_model

    label_lower = label.lower()

    if label_lower in ("basic", "depolarizing", "noise"):
        return build_depolarizing_noise_model(
            0.01,
            0.02,
            "Basic depolarizing noise model applied (1% 1q, 2% 2q)",
        )

    if label_lower == "ibm_eagle":
        return build_depolarizing_noise_model(
            0.0025,
            0.015,
            "IBM Eagle-inspired noise model applied (0.25% 1q, 1.5% 2q depolarizing)",
        )

    if label_lower == "ibm_osprey":
        return build_depolarizing_noise_model(
            0.003,
            0.02,
            "IBM Osprey-inspired noise model applied (0.3% 1q, 2.0% 2q depolarizing)",
        )

    try:
        spec = json.loads(label)
        error_rate = spec.get("error_rate", 0.01)
        return build_depolarizing_noise_model(
            error_rate,
            2 * error_rate,
            f"Custom noise model: {error_rate:.1%} 1q, {2 * error_rate:.1%} 2q depolarizing",
        )
    except (json.JSONDecodeError, TypeError, KeyError) as exc:
        if warnings is not None:
            warnings.append(f"Could not parse custom noise_model: '{label}' ({exc}), using no noise")
        return None


_engine = QASMEngine()


def execute_qasm(req: WorkspaceSimulateRequest):
    """Module-level convenience — delegates to QASMEngine."""
    return _engine.execute(req)


def _failure_response(engine: QASMEngine, warning: str):
    return engine.format_response(
        engine="openqasm",
        summary=WorkspaceSummary(qubits=[], actors=[], total_steps=0, measurements=0),
        steps=[],
        statevector=[],
        bloch_vectors=[],
        warnings=[warning],
    )


def _execute_qasm_impl(engine: QASMEngine, req: WorkspaceSimulateRequest):
    if not _QISKIT_AVAILABLE:
        return _failure_response(
            engine,
            (
                f"Qiskit is not installed or failed to import: {_QISKIT_ERROR}. "
                "Run: pip install qiskit qiskit-aer qiskit-qasm3-import"
            ),
        )

    warnings: list[str] = []

    try:
        try:
            circuit = qasm3.loads(req.code)
        except Exception as exc:
            return _failure_response(engine, f"QASM parse error ({type(exc).__name__}): {exc!r}")

        n_qubits = circuit.num_qubits
        gate_data = [instr for instr in circuit.data if instr.operation.name not in ("barrier", "measure")]

        # ── Track last operation per qubit ──────────────────────────────
        last_ops: dict[str, str] = {}

        steps: list[WorkspaceExecutionStep] = []
        running = QuantumCircuit(n_qubits)
        for step_i, instr in enumerate(gate_data):
            running.append(instr.operation, instr.qubits)
            sv = Statevector.from_instruction(running)

            gate_name = instr.operation.name.upper()
            q_labels = [f"q{circuit.find_bit(q).index}" for q in instr.qubits]
            label = f"{gate_name} {', '.join(q_labels)}"

            for ql in q_labels:
                last_ops[ql] = gate_name

            steps.append(
                WorkspaceExecutionStep(
                    index=step_i,
                    instruction=WorkspaceInstruction(
                        line=step_i + 1,
                        raw=label,
                        opcode=gate_name,
                        args=q_labels,
                        qubits=q_labels,
                        actors=[],
                        category="quantum",
                    ),
                    event=f"Applied {label}.",
                    state=_sv_to_state(list(sv.data), n_qubits, last_ops=dict(last_ops)),
                )
            )

        # ── Shot-based simulation ──────────────────────────────────────
        compute_target = req.compute or ("gpu" if req.prefer_gpu else None)
        sim = _build_simulator(compute_target, req.noise_model, warnings=warnings)
        meas_circuit = circuit.copy()
        if not any(instr.operation.name == "measure" for instr in circuit.data):
            meas_circuit.measure_all()
        counts = sim.run(transpile(meas_circuit, sim), shots=1024).result().get_counts()

        # ── Build MeasurementRecord entries from measured qubits ───────
        measurement_records: list[MeasurementRecord] = []
        measured_qubits: list[str] = []
        for instr in circuit.data:
            if instr.operation.name == "measure":
                for q in instr.qubits:
                    qid = f"q{circuit.find_bit(q).index}"
                    if qid not in measured_qubits:
                        measured_qubits.append(qid)

        if measured_qubits and counts:
            # Determine per-qubit outcomes from the most frequent bitstring.
            # Qiskit bitstrings: rightmost char = lowest classical bit.
            most_common = max(counts, key=counts.get)
            reversed_bits = most_common[::-1]  # index 0 = c[0]

            for meas_idx, qid in enumerate(measured_qubits):
                bit_val = int(reversed_bits[meas_idx]) if meas_idx < len(reversed_bits) else 0
                measurement_records.append(
                    MeasurementRecord(
                        qubit=qid,
                        basis="Z",
                        value=bit_val,
                        step=len(steps),
                    )
                )
                last_ops[qid] = "MEASURE[Z]"

        # ── Final statevector (gate-only) ──────────────────────────────
        gate_only = QuantumCircuit(n_qubits)
        for instr in gate_data:
            gate_only.append(instr.operation, instr.qubits)
        final_sv = Statevector.from_instruction(gate_only)

        # ── Add a measurement step if measurements exist ───────────────
        if measurement_records:
            steps.append(
                WorkspaceExecutionStep(
                    index=len(steps),
                    instruction=WorkspaceInstruction(
                        line=len(steps) + 1,
                        raw=f"MEASURE {', '.join(measured_qubits)}",
                        opcode="MEASURE",
                        args=measured_qubits,
                        qubits=measured_qubits,
                        actors=[],
                        category="quantum",
                    ),
                    event=f"Measured {', '.join(measured_qubits)} in Z basis.",
                    state=_sv_to_state(
                        list(final_sv.data), n_qubits,
                        last_ops=dict(last_ops),
                        measurements=measurement_records,
                    ),
                )
            )

        final_state = _sv_to_state(
            list(final_sv.data), n_qubits,
            last_ops=dict(last_ops),
            measurements=measurement_records,
        )

        return engine.format_response(
            engine="openqasm",
            summary=WorkspaceSummary(
                qubits=[f"q{i}" for i in range(n_qubits)],
                actors=[],
                total_steps=len(steps),
                measurements=len(measurement_records),
            ),
            steps=steps,
            measurements=measurement_records,
            statevector=final_state.statevector,
            bloch_vectors=list(final_state.bloch_vectors),
            shots=sum(counts.values()),
            counts=dict(counts),
            warnings=warnings,
        )
    except Exception as exc:
        return _failure_response(engine, f"{exc}\n\n{traceback.format_exc()}")
