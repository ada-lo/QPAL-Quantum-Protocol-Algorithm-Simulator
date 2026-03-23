from __future__ import annotations

import os
import platform
import time

from qiskit import QuantumCircuit, transpile
from qiskit.circuit.library import QFTGate
from qiskit_aer import AerSimulator

from api.schemas.workspace import (
    WorkspaceBenchmarkProfile,
    WorkspaceBenchmarkRequest,
    WorkspaceBenchmarkResponse,
    WorkspaceBenchmarkResult,
    WorkspaceSystemCapabilities,
)
from core.workspace.catalog import list_benchmark_profiles
from utils.gpu_utils import get_gpu_info


def _collect_capabilities() -> WorkspaceSystemCapabilities:
    gpu = get_gpu_info()
    cpu_name = platform.processor() or platform.uname().processor or platform.uname().machine or "Unknown CPU"
    return WorkspaceSystemCapabilities(
        cpu=cpu_name,
        cpu_cores=os.cpu_count() or 1,
        gpu_available=bool(gpu.get("available")),
        gpu_name=gpu.get("name"),
        gpu_memory=gpu.get("memory"),
        gpu_driver=gpu.get("driver"),
    )


def _build_ghz(qubits: int) -> QuantumCircuit:
    qc = QuantumCircuit(qubits, name="ghz")
    qc.h(0)
    for idx in range(qubits - 1):
        qc.cx(idx, idx + 1)
    qc.save_statevector()
    return qc


def _build_qft(qubits: int) -> QuantumCircuit:
    qc = QuantumCircuit(qubits, name="qft")
    qc.compose(QFTGate(num_qubits=qubits), inplace=True)
    qc.save_statevector()
    return qc


def _build_grover(qubits: int) -> QuantumCircuit:
    qc = QuantumCircuit(qubits, name="grover")
    for idx in range(qubits):
        qc.h(idx)
    qc.x(qubits - 1)
    if qubits > 1:
        controls = list(range(qubits - 1))
        qc.h(qubits - 1)
        qc.mcx(controls, qubits - 1)
        qc.h(qubits - 1)
    for idx in range(qubits):
        qc.h(idx)
        qc.x(idx)
    if qubits > 1:
        controls = list(range(qubits - 1))
        qc.h(qubits - 1)
        qc.mcx(controls, qubits - 1)
        qc.h(qubits - 1)
    for idx in range(qubits):
        qc.x(idx)
        qc.h(idx)
    qc.save_statevector()
    return qc


def _build_qaoa(qubits: int, layers: int = 2) -> QuantumCircuit:
    qc = QuantumCircuit(qubits, name="qaoa")
    for idx in range(qubits):
        qc.h(idx)
    for _ in range(layers):
        for idx in range(qubits - 1):
            qc.cx(idx, idx + 1)
            qc.rz(0.7, idx + 1)
            qc.cx(idx, idx + 1)
        for idx in range(qubits):
            qc.rx(0.4, idx)
    qc.save_statevector()
    return qc


BUILDERS = {
    "ghz": _build_ghz,
    "qft": _build_qft,
    "grover": _build_grover,
    "qaoa": _build_qaoa,
}


def _make_simulator(prefer_gpu: bool) -> tuple[AerSimulator, str, bool]:
    if prefer_gpu:
        try:
            simulator = AerSimulator(method="statevector", device="GPU")
            return simulator, "aer-gpu-statevector", True
        except Exception:
            pass
    return AerSimulator(method="statevector"), "aer-cpu-statevector", False


def _run_profile(profile: WorkspaceBenchmarkProfile, repetitions: int, prefer_gpu: bool) -> WorkspaceBenchmarkResult:
    builder = BUILDERS[profile.id]
    circuit = builder(profile.qubits)
    simulator, engine_used, gpu_used = _make_simulator(prefer_gpu)
    transpiled = transpile(circuit, simulator)

    durations = []
    for _ in range(repetitions):
        started = time.perf_counter()
        simulator.run(transpiled, shots=1).result()
        durations.append((time.perf_counter() - started) * 1000.0)

    gate_count = int(sum(transpiled.count_ops().values()))
    return WorkspaceBenchmarkResult(
        id=profile.id,
        label=profile.label,
        family=profile.family,
        qubits=profile.qubits,
        depth=int(transpiled.depth() or 0),
        gate_count=gate_count,
        duration_ms=round(sum(durations) / len(durations), 3),
        engine_used=engine_used,
        gpu_used=gpu_used,
        notes="Benchmark families are inspired by the public MQT Bench GHZ, QFT, Grover, and QAOA suites.",
    )


def run_benchmarks(req: WorkspaceBenchmarkRequest) -> WorkspaceBenchmarkResponse:
    profiles = list_benchmark_profiles()
    selected = set(req.benchmark_ids or [profile.id for profile in profiles])
    chosen = [profile for profile in profiles if profile.id in selected]

    results = [_run_profile(profile, req.repetitions, req.prefer_gpu) for profile in chosen]
    used_gpu = any(result.gpu_used for result in results)

    return WorkspaceBenchmarkResponse(
        capabilities=_collect_capabilities(),
        results=results,
        used_gpu=used_gpu,
        reference_note="Benchmark families are adapted from the public MQT Bench benchmark catalog.",
    )
