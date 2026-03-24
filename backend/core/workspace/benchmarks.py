"""Benchmark engine — zero external dependencies.

Uses QPAL's built-in ``_MiniSV`` pure-Python statevector simulator so that
benchmarks work everywhere without Qiskit, Aer, or any C++ compiled package.

Benchmark families are inspired by:
  - MQT Bench (TU Munich)
  - PennyLane demo circuits
"""
from __future__ import annotations

import math
import os
import platform
import time
from typing import Callable

from api.schemas.workspace import (
    WorkspaceBenchmarkProfile,
    WorkspaceBenchmarkRequest,
    WorkspaceBenchmarkResponse,
    WorkspaceBenchmarkResult,
    WorkspaceSystemCapabilities,
)
from core.workspace.catalog import list_benchmark_profiles
from core.workspace.executor import _MiniSV


# ── System info ─────────────────────────────────────────────────────────────

def _get_gpu_info() -> dict:
    """Return GPU info dict. Returns empty/unavailable if helpers are missing."""
    try:
        from utils.gpu_utils import get_gpu_info
        return get_gpu_info()
    except ImportError:
        return {"available": False, "name": None, "memory": None, "driver": None}


def _collect_capabilities() -> WorkspaceSystemCapabilities:
    gpu = _get_gpu_info()
    cpu_name = platform.processor() or platform.uname().processor or platform.uname().machine or "Unknown CPU"
    return WorkspaceSystemCapabilities(
        cpu=cpu_name,
        cpu_cores=os.cpu_count() or 1,
        gpu_available=bool(gpu.get("available")),
        gpu_name=gpu.get("name"),
        gpu_memory=gpu.get("memory"),
        gpu_driver=gpu.get("driver"),
    )


# ── Circuit builders (all pure-Python via _MiniSV) ──────────────────────────

def _build_ghz(n: int) -> Callable[[_MiniSV], int]:
    """GHZ: H on q0, then cascade CNOT."""
    def run(sv: _MiniSV) -> int:
        sv.apply_h(0)
        for i in range(n - 1):
            sv.apply_cnot(i, i + 1)
        return n + (n - 1)  # gate count
    return run


def _build_qft(n: int) -> Callable[[_MiniSV], int]:
    """QFT: Hadamard + controlled-phase rotations + SWAP bit-reversal."""
    def run(sv: _MiniSV) -> int:
        gates = 0
        for i in range(n):
            sv.apply_h(i)
            gates += 1
            for j in range(i + 1, n):
                angle = math.pi / (1 << (j - i))
                # Controlled-RZ decomposition: CNOT → RZ → CNOT → RZ
                sv.apply_cnot(j, i)
                sv.apply_rz(i, -angle / 2)
                sv.apply_cnot(j, i)
                sv.apply_rz(i, angle / 2)
                gates += 4
        for i in range(n // 2):
            sv.apply_swap(i, n - 1 - i)
            gates += 1
        return gates
    return run


def _build_grover(n: int) -> Callable[[_MiniSV], int]:
    """Grover: uniform superposition → oracle (multi-CZ) → diffusion. One iteration."""
    def run(sv: _MiniSV) -> int:
        gates = 0
        # Superposition
        for i in range(n):
            sv.apply_h(i)
            gates += 1
        # Oracle: mark |11...1⟩ by flipping phase via CZ cascade
        for i in range(n - 1):
            sv.apply_cz(i, i + 1)
            gates += 1
        # Diffusion: H → X → multi-CZ → X → H
        for i in range(n):
            sv.apply_h(i)
            sv.apply_x(i)
            gates += 2
        for i in range(n - 1):
            sv.apply_cz(i, i + 1)
            gates += 1
        for i in range(n):
            sv.apply_x(i)
            sv.apply_h(i)
            gates += 2
        return gates
    return run


def _build_qaoa(n: int, layers: int = 2) -> Callable[[_MiniSV], int]:
    """QAOA: ZZ cost layer + RX mixer, multiple rounds."""
    gamma, beta = 0.7, 0.4

    def run(sv: _MiniSV) -> int:
        gates = 0
        for i in range(n):
            sv.apply_h(i)
            gates += 1
        for _ in range(layers):
            # Cost: ZZ coupling via CNOT-RZ-CNOT per edge
            for i in range(n - 1):
                sv.apply_cnot(i, i + 1)
                sv.apply_rz(i + 1, 2 * gamma)
                sv.apply_cnot(i, i + 1)
                gates += 3
            # Mixer: RX on each qubit
            for i in range(n):
                sv.apply_rx(i, 2 * beta)
                gates += 1
        return gates
    return run


def _build_vqe(n: int) -> Callable[[_MiniSV], int]:
    """VQE hardware-efficient ansatz: RY → CNOT → RY layers."""
    def run(sv: _MiniSV) -> int:
        gates = 0
        # Layer 1
        for i in range(n):
            sv.apply_ry(i, 0.5 + 0.3 * i)
            gates += 1
        # Entangling
        for i in range(n - 1):
            sv.apply_cnot(i, i + 1)
            gates += 1
        # Layer 2
        for i in range(n):
            sv.apply_ry(i, 0.8 - 0.2 * i)
            gates += 1
        return gates
    return run


def _build_qpe(n: int) -> Callable[[_MiniSV], int]:
    """QPE: 1 target + (n-1) estimation qubits estimating T-gate phase."""
    def run(sv: _MiniSV) -> int:
        gates = 0
        target = n - 1
        est_wires = n - 1

        # Prepare eigenstate |1⟩ on target
        sv.apply_x(target)
        gates += 1

        # Hadamard on estimation qubits
        for i in range(est_wires):
            sv.apply_h(i)
            gates += 1

        # Controlled-U^(2^k) on target
        for k in range(est_wires):
            angle = math.pi / 4 * (1 << k)  # T^(2^k) phase
            sv.apply_cnot(k, target)
            sv.apply_rz(target, -angle / 2)
            sv.apply_cnot(k, target)
            sv.apply_rz(target, angle / 2)
            gates += 4

        # Inverse QFT on estimation qubits
        for i in range(est_wires // 2):
            sv.apply_swap(i, est_wires - 1 - i)
            gates += 1
        for i in range(est_wires):
            sv.apply_h(i)
            gates += 1
            for j in range(i + 1, est_wires):
                angle = -math.pi / (1 << (j - i))
                sv.apply_cnot(j, i)
                sv.apply_rz(i, -angle / 2)
                sv.apply_cnot(j, i)
                sv.apply_rz(i, angle / 2)
                gates += 4
        return gates
    return run


def _build_wstate(n: int) -> Callable[[_MiniSV], int]:
    """W-state preparation: exactly one excitation spread equally."""
    def run(sv: _MiniSV) -> int:
        gates = 0
        sv.apply_x(0)
        gates += 1
        for i in range(n - 1):
            angle = math.atan2(1, math.sqrt(n - 1 - i))
            sv.apply_ry(i, 2 * angle)
            sv.apply_cnot(i, i + 1)
            gates += 2
        return gates
    return run


def _build_dj(n: int) -> Callable[[_MiniSV], int]:
    """Deutsch-Jozsa: balanced oracle + Hadamard."""
    def run(sv: _MiniSV) -> int:
        gates = 0
        # Prepare ancilla |1⟩
        sv.apply_x(n - 1)
        gates += 1
        # Hadamard all
        for i in range(n):
            sv.apply_h(i)
            gates += 1
        # Balanced oracle: CNOT from each input to ancilla
        for i in range(n - 1):
            sv.apply_cnot(i, n - 1)
            gates += 1
        # Hadamard input qubits
        for i in range(n - 1):
            sv.apply_h(i)
            gates += 1
        return gates
    return run


# ── Runner ──────────────────────────────────────────────────────────────────

_BUILDERS: dict[str, Callable[[int], Callable[[_MiniSV], int]]] = {
    "ghz": _build_ghz,
    "qft": _build_qft,
    "grover": _build_grover,
    "qaoa": _build_qaoa,
    "vqe": _build_vqe,
    "qpe": _build_qpe,
    "wstate": _build_wstate,
    "dj": _build_dj,
}


def _estimate_depth(gate_count: int, n_qubits: int) -> int:
    """Rough depth estimate: gates / qubits (at least 1)."""
    return max(1, gate_count // max(1, n_qubits))


def _run_profile(profile: WorkspaceBenchmarkProfile, repetitions: int) -> WorkspaceBenchmarkResult:
    builder_fn = _BUILDERS.get(profile.id)
    if builder_fn is None:
        raise ValueError(f"Unknown benchmark: {profile.id}")

    circuit_fn = builder_fn(profile.qubits)

    durations: list[float] = []
    gate_count = 0
    for _ in range(repetitions):
        sv = _MiniSV()
        for q in range(profile.qubits):
            sv.ensure_qubit(q)
        started = time.perf_counter()
        gate_count = circuit_fn(sv)
        durations.append((time.perf_counter() - started) * 1000.0)

    return WorkspaceBenchmarkResult(
        id=profile.id,
        label=profile.label,
        family=profile.family,
        qubits=profile.qubits,
        depth=_estimate_depth(gate_count, profile.qubits),
        gate_count=gate_count,
        duration_ms=round(float(sum(durations) / len(durations)), 3),
        engine_used="qpal-minisv",
        gpu_used=False,
        notes=(
            "Pure-Python statevector simulation via QPAL's built-in _MiniSV engine. "
            "Benchmark families inspired by MQT Bench and PennyLane."
        ),
    )


def run_benchmarks(req: WorkspaceBenchmarkRequest) -> WorkspaceBenchmarkResponse:
    profiles = list_benchmark_profiles()
    selected = set(req.benchmark_ids or [profile.id for profile in profiles])
    chosen = [profile for profile in profiles if profile.id in selected]

    results = [_run_profile(profile, req.repetitions) for profile in chosen]

    return WorkspaceBenchmarkResponse(
        capabilities=_collect_capabilities(),
        results=results,
        used_gpu=False,
        reference_note=(
            "Zero-dependency benchmarks powered by QPAL's _MiniSV pure-Python statevector engine. "
            "Circuit families adapted from MQT Bench and PennyLane templates."
        ),
    )
