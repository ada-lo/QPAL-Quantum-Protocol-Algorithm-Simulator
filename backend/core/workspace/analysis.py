"""Analysis module — optional entanglement metrics and variational landscape.

Dependencies are optional and loaded lazily:
  - toqito: entanglement metrics (concurrence, negativity)
  - orqviz: variational landscape plotting
  - stim: stabilizer circuit / QEC simulation

Install with: pip install toqito orqviz stim
"""
from __future__ import annotations

import base64
import io
import math
from typing import Any

from api.schemas.workspace import (
    WorkspaceAnalysisRequest,
    WorkspaceAnalysisResponse,
    EntanglementMetrics,
    LandscapeData,
    StimResult,
)
from core.workspace.executor import _MiniSV


# ── Entanglement Analysis (toqito) ──────────────────────────────────────────

def _build_density_matrix(sv: _MiniSV) -> list[list[complex]]:
    """Build full density matrix from _MiniSV statevector."""
    n = len(sv.sv)
    rho: list[list[complex]] = [[complex(0)] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            rho[i][j] = sv.sv[i] * sv.sv[j].conjugate()
    return rho


def _rho_to_numpy(rho: list[list[complex]]) -> Any:
    """Convert to numpy array (lazy import)."""
    import numpy as np
    return np.array(rho, dtype=complex)


def compute_entanglement(sv: _MiniSV) -> EntanglementMetrics:
    """Compute entanglement metrics using toqito (if available)."""
    rho = _build_density_matrix(sv)
    n_qubits = sv.n
    dim = len(rho)

    # Pure-Python purity: Tr(ρ²)
    purity_val = 0.0
    for i in range(dim):
        for j in range(dim):
            purity_val += (rho[i][j] * rho[j][i]).real
    purity_val = min(round(purity_val, 6), 1.0)

    try:
        import numpy as np
        from toqito.state_metrics import concurrence as toqito_concurrence
        from toqito.state_props import negativity as toqito_negativity

        rho_np = np.array(rho, dtype=complex)
        conc = float(toqito_concurrence(rho_np)) if n_qubits == 2 else None
        neg = float(toqito_negativity(rho_np, [2] * n_qubits, 0)) if n_qubits >= 2 else None
        is_ent = conc is not None and conc > 1e-6

        return EntanglementMetrics(
            concurrence=conc,
            negativity=neg,
            purity=purity_val,
            is_entangled=is_ent,
            engine="toqito",
        )
    except ImportError:
        return EntanglementMetrics(
            concurrence=None,
            negativity=None,
            purity=purity_val,
            is_entangled=None,
            engine="builtin-purity-only",
        )


# ── Variational Landscape (orqviz) ─────────────────────────────────────────
_ROTATION_GATES = {"RX", "RY", "RZ"}
_GATE_DISPATCH = {
    "H": lambda sv, q, _tq: sv.apply_h(q),
    "X": lambda sv, q, _tq: sv.apply_x(q),
    "Y": lambda sv, q, _tq: sv.apply_y(q),
    "Z": lambda sv, q, _tq: sv.apply_z(q),
    "S": lambda sv, q, _tq: sv.apply_s(q),
    "T": lambda sv, q, _tq: sv.apply_t(q),
    "SDG": lambda sv, q, _tq: sv.apply_sdg(q),
    "TDG": lambda sv, q, _tq: sv.apply_tdg(q),
    "SX": lambda sv, q, _tq: sv.apply_sx(q),
    "CNOT": lambda sv, q, tq: sv.apply_cnot(q, tq),
    "CZ": lambda sv, q, tq: sv.apply_cz(q, tq),
    "SWAP": lambda sv, q, tq: sv.apply_swap(q, tq),
}


def _apply_gates_from_preset(
    sv: _MiniSV,
    gates: list[dict],
    theta1: float,
    theta2: float,
) -> None:
    """Apply a preset gate list onto _MiniSV, substituting variational angles.

    The first rotational gate (RX/RY/RZ) encountered uses theta1, the second
    uses theta2.  Non-rotational gates are applied directly.
    """
    rotation_index = 0
    for gate in gates:
        gate_id = gate.get("gateId", "").upper()
        qubit = int(gate.get("qubit", 0))
        target_qubit = gate.get("targetQubit")
        tq = int(target_qubit) if target_qubit is not None else 0

        if gate_id in _ROTATION_GATES:
            angle = theta1 if rotation_index == 0 else theta2
            rotation_index += 1
            if gate_id == "RX":
                sv.apply_rx(qubit, angle)
            elif gate_id == "RY":
                sv.apply_ry(qubit, angle)
            else:
                sv.apply_rz(qubit, angle)
        elif gate_id in _GATE_DISPATCH:
            _GATE_DISPATCH[gate_id](sv, qubit, tq)
        elif gate_id == "TOFFOLI" and len(gate.get("controlQubits", [])) >= 2:
            sv.apply_toffoli(
                int(gate["controlQubits"][0]),
                int(gate["controlQubits"][1]),
                qubit,
            )


def compute_landscape(
    n_qubits: int,
    circuit_type: str = "vqe",
    grid_points: int = 20,
    circuit_gates: list[dict] | None = None,
    preset_label: str | None = None,
) -> LandscapeData:
    """Sweep two variational parameters and compute the energy surface.

    When *circuit_gates* is provided the sweep is performed over that gate list,
    inserting two synthetic RY rotations if no rotational gates (RX/RY/RZ) are
    present.  Otherwise the existing hardcoded VQE/QAOA toy circuits are used.
    """
    use_preset = circuit_gates is not None and len(circuit_gates) > 0

    # If the preset contains no rotational gates, prepend two synthetic RYs
    if use_preset:
        has_rotations = any(
            g.get("gateId", "").upper() in _ROTATION_GATES for g in circuit_gates  # type: ignore[union-attr]
        )
        if not has_rotations:
            q0 = 0
            q1 = min(1, n_qubits - 1)
            circuit_gates = [
                {"gateId": "RY", "qubit": q0, "step": -2},
                {"gateId": "RY", "qubit": q1, "step": -1},
                *circuit_gates,  # type: ignore[list-item]
            ]

    display_label = (
        preset_label or "Preset"
    ) if use_preset else circuit_type.upper()

    angles_x: list[float] = []
    angles_y: list[float] = []
    energies: list[list[float]] = []

    for i in range(grid_points):
        theta1 = -math.pi + 2 * math.pi * i / (grid_points - 1)
        angles_x.append(round(theta1, 4))
        row: list[float] = []
        for j in range(grid_points):
            theta2 = -math.pi + 2 * math.pi * j / (grid_points - 1)
            if i == 0:
                angles_y.append(round(theta2, 4))

            # Run mini circuit with these params
            sv = _MiniSV()
            for q in range(n_qubits):
                sv.ensure_qubit(q)

            if use_preset:
                _apply_gates_from_preset(sv, circuit_gates, theta1, theta2)  # type: ignore[arg-type]
            elif circuit_type == "vqe":
                sv.apply_ry(0, theta1)
                sv.apply_ry(1, theta2)
                if n_qubits > 1:
                    sv.apply_cnot(0, 1)
            elif circuit_type == "qaoa":
                sv.apply_h(0)
                sv.apply_h(1)
                if n_qubits > 1:
                    sv.apply_cnot(0, 1)
                    sv.apply_rz(1, theta1)
                    sv.apply_cnot(0, 1)
                sv.apply_rx(0, theta2)
                sv.apply_rx(1, theta2)

            # Compute ⟨Z⊗Z⟩ expectation value
            energy = 0.0
            dim = 1 << sv.n
            for k in range(dim):
                prob = abs(sv.sv[k]) ** 2
                # Z eigenvalue for qubit 0: +1 if bit=0, -1 if bit=1
                z0 = 1 - 2 * ((k >> 0) & 1)
                z1 = 1 - 2 * ((k >> 1) & 1) if n_qubits > 1 else 1
                energy += prob * z0 * z1
            row.append(round(energy, 6))
        energies.append(row)

    # Try to use matplotlib for a PNG plot
    plot_base64: str | None = None
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np

        fig, ax = plt.subplots(1, 1, figsize=(6, 5))
        X, Y = np.meshgrid(angles_y, angles_x)
        Z = np.array(energies)
        c = ax.contourf(X, Y, Z, levels=30, cmap="RdYlBu_r")
        fig.colorbar(c, ax=ax, label="⟨Z⊗Z⟩")
        ax.set_xlabel("θ₂")
        ax.set_ylabel("θ₁")
        ax.set_title(f"{display_label} Energy Landscape ({n_qubits}q)")

        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=100, bbox_inches="tight")
        plt.close(fig)
        buf.seek(0)
        plot_base64 = base64.b64encode(buf.read()).decode("ascii")
    except ImportError:
        pass

    return LandscapeData(
        angles_x=angles_x,
        angles_y=angles_y,
        energies=energies,
        circuit_type="preset" if use_preset else circuit_type,
        preset_label=preset_label if use_preset else None,
        plot_base64=plot_base64,
    )


# ── Stim Clifford Simulation ───────────────────────────────────────────────

def run_stim_circuit(
    qubits: int,
    circuit_type: str = "ghz",
    noise_p: float = 0.0,
    shots: int = 1000,
) -> StimResult:
    """Run a stabilizer circuit via Stim (if available)."""
    try:
        import stim

        circuit = stim.Circuit()

        if circuit_type == "ghz":
            circuit.append("H", [0])
            for i in range(qubits - 1):
                if noise_p > 0:
                    circuit.append("DEPOLARIZE2", [i, i + 1], noise_p)
                circuit.append("CNOT", [i, i + 1])
            circuit.append("M", list(range(qubits)))
        elif circuit_type == "bell":
            circuit.append("H", [0])
            if noise_p > 0:
                circuit.append("DEPOLARIZE2", [0, 1], noise_p)
            circuit.append("CNOT", [0, 1])
            circuit.append("M", [0, 1])
        else:
            # Default: all-H + measure
            for i in range(qubits):
                circuit.append("H", [i])
                if noise_p > 0:
                    circuit.append("DEPOLARIZE1", [i], noise_p)
            circuit.append("M", list(range(qubits)))

        sampler = circuit.compile_sampler()
        results = sampler.sample(shots)

        # Compute outcome distribution
        counts: dict[str, int] = {}
        for row in results:
            key = "".join(str(int(b)) for b in row)
            counts[key] = counts.get(key, 0) + 1

        # Fidelity estimate: for GHZ, ideal outcomes are 000...0 and 111...1
        if circuit_type == "ghz":
            all0 = "0" * qubits
            all1 = "1" * qubits
            fidelity = (counts.get(all0, 0) + counts.get(all1, 0)) / shots
        elif circuit_type == "bell":
            fidelity = (counts.get("00", 0) + counts.get("11", 0)) / shots
        else:
            fidelity = None

        return StimResult(
            circuit_type=circuit_type,
            qubits=qubits,
            noise_p=noise_p,
            shots=shots,
            outcome_counts=counts,
            fidelity=fidelity,
            engine="stim",
        )

    except ImportError:
        return StimResult(
            circuit_type=circuit_type,
            qubits=qubits,
            noise_p=noise_p,
            shots=shots,
            outcome_counts={},
            fidelity=None,
            engine="unavailable (pip install stim)",
        )


# ── Entry point ─────────────────────────────────────────────────────────────

def run_analysis(req: WorkspaceAnalysisRequest) -> WorkspaceAnalysisResponse:
    """Dispatch analysis request to the appropriate engine."""
    entanglement: EntanglementMetrics | None = None
    landscape: LandscapeData | None = None
    stim_result: StimResult | None = None

    if req.run_entanglement:
        sv = _MiniSV()
        n = req.qubits or 2
        for q in range(n):
            sv.ensure_qubit(q)
        # Build a test circuit
        sv.apply_h(0)
        if n > 1:
            sv.apply_cnot(0, 1)
        entanglement = compute_entanglement(sv)

    if req.run_landscape:
        landscape = compute_landscape(
            n_qubits=req.qubits or 2,
            circuit_type=req.landscape_circuit or "vqe",
            grid_points=req.landscape_grid or 20,
            circuit_gates=req.circuit_gates,
            preset_label=req.preset_label,
        )

    if req.run_stim:
        stim_result = run_stim_circuit(
            qubits=req.qubits or 4,
            circuit_type=req.stim_circuit or "ghz",
            noise_p=req.stim_noise or 0.0,
            shots=req.stim_shots or 1000,
        )

    return WorkspaceAnalysisResponse(
        entanglement=entanglement,
        landscape=landscape,
        stim=stim_result,
    )
