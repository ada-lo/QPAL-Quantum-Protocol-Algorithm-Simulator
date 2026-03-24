from __future__ import annotations

import cmath
import math
import random
from copy import deepcopy

from api.schemas.workspace import (
    MeasurementRecord,
    TransmissionRecord,
    WorkspaceActorState,
    WorkspaceBlochVector,
    WorkspaceExecutionState,
    WorkspaceExecutionStep,
    WorkspaceInstruction,
    WorkspaceQubitState,
    WorkspaceSimulateRequest,
    WorkspaceSimulateResponse,
    WorkspaceSummary,
)


H_MAP = {"0": "+", "1": "-", "+": "0", "-": "1", "mixed": "mixed", "uninitialized": "+"}
X_MAP = {"0": "1", "1": "0", "+": "+", "-": "-", "mixed": "mixed", "uninitialized": "1"}
Z_MAP = {"0": "0", "1": "1", "+": "-", "-": "+", "mixed": "mixed", "uninitialized": "0"}

_S2 = 1.0 / math.sqrt(2.0)
_MAX_SV_QUBITS = 12  # statevector sim capped at 12 qubits for performance


# ── Lightweight statevector mini-simulator ────────────────────────────────────
# Mirrors the frontend simulator.ts math in pure Python (no numpy needed).
# Runs alongside the symbolic executor to provide accurate Bloch vectors.

class _MiniSV:
    """Minimal statevector simulator for ≤ _MAX_SV_QUBITS qubits."""

    __slots__ = ("n", "sv")

    def __init__(self) -> None:
        self.n: int = 0
        self.sv: list[complex] = []

    @property
    def active(self) -> bool:
        return self.n > 0 and len(self.sv) > 0

    def ensure_qubit(self, qubit_index: int) -> None:
        """Grow the statevector if a new qubit index appears."""
        needed = qubit_index + 1
        if needed <= self.n:
            return
        if needed > _MAX_SV_QUBITS:
            # Too many qubits — disable the sim
            self.n = 0
            self.sv = []
            return
        # Tensor-extend: existing state ⊗ |0⟩^(needed - self.n)
        if self.n == 0:
            self.n = needed
            self.sv = [complex(0)] * (1 << self.n)
            self.sv[0] = complex(1)
        else:
            extra = needed - self.n
            new_dim = 1 << needed
            new_sv = [complex(0)] * new_dim
            # Old amplitudes map to the same indices (new qubits = 0)
            for i, amp in enumerate(self.sv):
                new_sv[i << extra] = amp
            self.n = needed
            self.sv = new_sv

    def _apply_1q(self, q: int, u00: complex, u01: complex, u10: complex, u11: complex) -> None:
        if not self.active:
            return
        dim = 1 << self.n
        sv = self.sv
        for i in range(dim):
            if (i >> q) & 1 == 0:
                j = i | (1 << q)
                a, b = sv[i], sv[j]
                sv[i] = u00 * a + u01 * b
                sv[j] = u10 * a + u11 * b

    def apply_h(self, q: int) -> None:
        self._apply_1q(q, _S2, _S2, _S2, -_S2)

    def apply_x(self, q: int) -> None:
        self._apply_1q(q, 0, 1, 1, 0)

    def apply_y(self, q: int) -> None:
        self._apply_1q(q, 0, -1j, 1j, 0)

    def apply_z(self, q: int) -> None:
        self._apply_1q(q, 1, 0, 0, -1)

    def apply_s(self, q: int) -> None:
        self._apply_1q(q, 1, 0, 0, 1j)

    def apply_sdg(self, q: int) -> None:
        self._apply_1q(q, 1, 0, 0, -1j)

    def apply_t(self, q: int) -> None:
        self._apply_1q(q, 1, 0, 0, cmath.exp(1j * math.pi / 4))

    def apply_tdg(self, q: int) -> None:
        self._apply_1q(q, 1, 0, 0, cmath.exp(-1j * math.pi / 4))

    def apply_sx(self, q: int) -> None:
        h = 0.5
        self._apply_1q(q, complex(h, h), complex(h, -h), complex(h, -h), complex(h, h))

    def apply_rx(self, q: int, theta: float) -> None:
        c, s = math.cos(theta / 2), math.sin(theta / 2)
        self._apply_1q(q, complex(c, 0), complex(0, -s), complex(0, -s), complex(c, 0))

    def apply_ry(self, q: int, theta: float) -> None:
        c, s = math.cos(theta / 2), math.sin(theta / 2)
        self._apply_1q(q, c, -s, s, c)

    def apply_rz(self, q: int, theta: float) -> None:
        self._apply_1q(q, cmath.exp(-1j * theta / 2), 0, 0, cmath.exp(1j * theta / 2))

    def apply_cnot(self, c: int, t: int) -> None:
        if not self.active:
            return
        dim = 1 << self.n
        sv = self.sv
        for i in range(dim):
            if ((i >> c) & 1) == 1:
                j = i ^ (1 << t)
                if j > i:
                    sv[i], sv[j] = sv[j], sv[i]

    def apply_cz(self, c: int, t: int) -> None:
        if not self.active:
            return
        dim = 1 << self.n
        sv = self.sv
        for i in range(dim):
            if ((i >> c) & 1) == 1 and ((i >> t) & 1) == 1:
                sv[i] = -sv[i]

    def apply_swap(self, a: int, b: int) -> None:
        if not self.active:
            return
        dim = 1 << self.n
        sv = self.sv
        for i in range(dim):
            ba = (i >> a) & 1
            bb = (i >> b) & 1
            if ba != bb:
                j = i ^ (1 << a) ^ (1 << b)
                if j > i:
                    sv[i], sv[j] = sv[j], sv[i]

    def apply_toffoli(self, c1: int, c2: int, t: int) -> None:
        if not self.active:
            return
        dim = 1 << self.n
        sv = self.sv
        for i in range(dim):
            if ((i >> c1) & 1) == 1 and ((i >> c2) & 1) == 1:
                j = i ^ (1 << t)
                if j > i:
                    sv[i], sv[j] = sv[j], sv[i]

    def init_qubit(self, q: int, state: str) -> None:
        """Re-initialize a single qubit to the given state label.
        This is approximate: it zeroes out the |1⟩ component and sets |0⟩,
        then applies gates to reach the desired state. For multi-qubit entangled
        states, this collapses the qubit first."""
        if not self.active:
            return
        self._collapse_qubit(q, 0)  # Force to |0⟩
        if state == "1":
            self.apply_x(q)
        elif state == "+":
            self.apply_h(q)
        elif state == "-":
            self.apply_x(q)
            self.apply_h(q)

    def measure_qubit(self, q: int, rng: random.Random, basis: str = "Z") -> int:
        """Measure qubit q in the given basis, collapse the state, return 0 or 1.

        For X-basis: apply H, collapse in Z, apply H again.
        This ensures |+⟩ → outcome 0, |−⟩ → outcome 1.
        """
        if not self.active:
            return rng.randint(0, 1)
        if basis == "X":
            self.apply_h(q)  # rotate X-eigenstates to Z-eigenstates
        dim = 1 << self.n
        sv = self.sv
        prob0 = sum(abs(sv[i]) ** 2 for i in range(dim) if (i >> q) & 1 == 0)
        outcome = 0 if rng.random() < prob0 else 1
        self._collapse_qubit(q, outcome)
        if basis == "X":
            self.apply_h(q)  # rotate back to X-eigenstates
        return outcome

    def _collapse_qubit(self, q: int, outcome: int) -> None:
        """Project qubit q onto |outcome⟩ and renormalize."""
        if not self.active:
            return
        dim = 1 << self.n
        sv = self.sv
        norm_sq = 0.0
        for i in range(dim):
            if ((i >> q) & 1) != outcome:
                sv[i] = complex(0)
            else:
                norm_sq += abs(sv[i]) ** 2
        if norm_sq > 1e-15:
            factor = 1.0 / math.sqrt(norm_sq)
            for i in range(dim):
                sv[i] *= factor


def _bloch_from_sv(sv: list[complex], n: int, q: int) -> tuple[float, float, float, float]:
    """Compute Bloch vector (x, y, z) and purity via partial trace.

    Uses the same math as Qiskit's plot_bloch_multivector and QPAL's frontend
    blochVector(): partial trace to reduced density matrix, then Pauli expectations.
    """
    dim = 1 << n
    r00 = 0.0
    r01_re = 0.0
    r01_im = 0.0
    r11 = 0.0
    for i in range(dim):
        if (i >> q) & 1 == 0:
            j = i | (1 << q)
            a_re, a_im = sv[i].real, sv[i].imag
            b_re, b_im = sv[j].real, sv[j].imag
            r00 += a_re * a_re + a_im * a_im
            r11 += b_re * b_re + b_im * b_im
            # ρ₀₁ += sv[i] × conj(sv[j])
            r01_re += a_re * b_re + a_im * b_im
            r01_im += a_im * b_re - a_re * b_im
        # else: accounted for via j = i | (1<<q)

    x = 2.0 * r01_re      # ⟨σ_x⟩
    y = 2.0 * r01_im       # ⟨σ_y⟩
    z = r00 - r11           # ⟨σ_z⟩
    purity = math.sqrt(x * x + y * y + z * z)
    return x, y, z, min(purity, 1.0)


def _make_qubit(qubit_id: str) -> dict:
    return {
        "id": qubit_id,
        "initialized": False,
        "state_label": "uninitialized",
        "superposition": False,
        "owner": None,
        "location": None,
        "entangled_with": [],
        "intercepted_by": None,
        "last_operation": None,
    }


def _ensure_actor(actors: dict[str, dict], actor_name: str) -> None:
    if actor_name not in actors:
        actors[actor_name] = {"name": actor_name}


def _ensure_qubit(qubits: dict[str, dict], qubit_id: str) -> dict:
    if qubit_id not in qubits:
        qubits[qubit_id] = _make_qubit(qubit_id)
    return qubits[qubit_id]


def _remove_link(qubits: dict[str, dict], source: str, target: str) -> None:
    if source in qubits and target in qubits[source]["entangled_with"]:
        qubits[source]["entangled_with"] = [item for item in qubits[source]["entangled_with"] if item != target]


def _clear_entanglement(qubits: dict[str, dict], qubit_id: str) -> None:
    qubit = _ensure_qubit(qubits, qubit_id)
    partners = list(qubit["entangled_with"])
    for partner_id in partners:
        _remove_link(qubits, partner_id, qubit_id)
    qubit["entangled_with"] = []


def _set_state(qubit: dict, label: str) -> None:
    qubit["initialized"] = True
    qubit["state_label"] = label
    qubit["superposition"] = label in {"+", "-", "mixed"}


def _autoinit(qubits: dict[str, dict], qubit_id: str, warnings: list[str], opcode: str) -> dict:
    qubit = _ensure_qubit(qubits, qubit_id)
    if not qubit["initialized"]:
        warnings.append(f"{opcode} used {qubit_id} before INIT; defaulted to |0>.")
        _set_state(qubit, "0")
    return qubit


def _apply_h(qubit: dict) -> None:
    _set_state(qubit, H_MAP.get(qubit["state_label"], "mixed"))


def _apply_x(qubit: dict) -> None:
    _set_state(qubit, X_MAP.get(qubit["state_label"], "mixed"))


def _apply_z(qubit: dict) -> None:
    _set_state(qubit, Z_MAP.get(qubit["state_label"], "mixed"))


def _apply_y(qubit: dict) -> None:
    _apply_x(qubit)
    _apply_z(qubit)


def _link_group(qubits: dict[str, dict], qubit_ids: list[str]) -> None:
    unique_ids = list(dict.fromkeys(qubit_ids))
    for qubit_id in unique_ids:
        _clear_entanglement(qubits, qubit_id)
    for qubit_id in unique_ids:
        qubit = _ensure_qubit(qubits, qubit_id)
        _set_state(qubit, "mixed")
        qubit["entangled_with"] = [other_id for other_id in unique_ids if other_id != qubit_id]


def _apply_phase_like(qubit: dict) -> None:
    _apply_z(qubit)


def _apply_sx(qubit: dict) -> None:
    if qubit["state_label"] in {"0", "1"}:
        _apply_h(qubit)
        return
    qubit["state_label"] = "mixed"
    qubit["superposition"] = True


def _normalized_angle(instruction: WorkspaceInstruction) -> float:
    value = instruction.metadata.get("angle", 0.0)
    try:
        angle = float(value)
    except (TypeError, ValueError):
        return 0.0
    return abs(angle) % (2 * math.pi)


def _apply_rotation(qubit: dict, opcode: str, angle: float) -> str:
    if angle < 0.2:
        return f"{opcode} produced no visible change."

    if opcode == "RZ":
        if angle < 2.2:
            _apply_phase_like(qubit)
            return "RZ approximated a phase update."
        _apply_z(qubit)
        return "RZ approximated a Z flip."

    if opcode == "RY":
        if angle < 2.2:
            _apply_h(qubit)
            return "RY approximated a basis rotation."
        _apply_y(qubit)
        return "RY approximated a Y flip."

    if angle < 2.2:
        _set_state(qubit, "mixed")
        return "RX approximated a partial rotation."
    _apply_x(qubit)
    return "RX approximated an X flip."


def _bloch_for_qubit_label(qubit: dict) -> WorkspaceBlochVector:
    """Fallback: label-based Bloch vector (used when statevector sim is disabled)."""
    label = qubit["state_label"]
    if qubit["entangled_with"] or label == "mixed":
        vector = (0.0, 0.0, 0.0)
        purity = 0.0
    elif label == "0":
        vector = (0.0, 0.0, 1.0)
        purity = 1.0
    elif label == "1":
        vector = (0.0, 0.0, -1.0)
        purity = 1.0
    elif label == "+":
        vector = (1.0, 0.0, 0.0)
        purity = 1.0
    elif label == "-":
        vector = (-1.0, 0.0, 0.0)
        purity = 1.0
    else:
        vector = (0.0, 0.0, 0.0)
        purity = 0.0

    return WorkspaceBlochVector(qubit=qubit["id"], x=vector[0], y=vector[1], z=vector[2], purity=purity)


def _build_bloch_vectors(
    qubits: dict[str, dict],
    qubit_index_map: dict[str, int],
    mini_sv: _MiniSV,
) -> list[WorkspaceBlochVector]:
    """Compute Bloch vectors using the statevector sim when available."""
    result = []
    for qubit_id in sorted(qubits):
        idx = qubit_index_map.get(qubit_id)
        if mini_sv.active and idx is not None and idx < mini_sv.n:
            x, y, z, purity = _bloch_from_sv(mini_sv.sv, mini_sv.n, idx)
            result.append(WorkspaceBlochVector(qubit=qubit_id, x=x, y=y, z=z, purity=purity))
        else:
            result.append(_bloch_for_qubit_label(qubits[qubit_id]))
    return result


def _snapshot(
    qubits: dict[str, dict],
    actors: dict[str, dict],
    measurements: list[MeasurementRecord],
    transmissions: list[TransmissionRecord],
    qubit_index_map: dict[str, int],
    mini_sv: _MiniSV,
) -> WorkspaceExecutionState:
    actor_states = []
    for actor_name in sorted(actors):
        owned = sorted(
            qubit_id
            for qubit_id, qubit in qubits.items()
            if qubit["owner"] == actor_name or qubit["location"] == actor_name
        )
        actor_states.append(WorkspaceActorState(name=actor_name, owned_qubits=owned))

    qubit_states = []
    for qubit_id in sorted(qubits):
        qubit = qubits[qubit_id]
        qubit_states.append(
            WorkspaceQubitState(
                id=qubit["id"],
                initialized=qubit["initialized"],
                state_label=qubit["state_label"],
                superposition=qubit["superposition"],
                owner=qubit["owner"],
                location=qubit["location"],
                entangled_with=sorted(qubit["entangled_with"]),
                intercepted_by=qubit["intercepted_by"],
                last_operation=qubit["last_operation"],
            )
        )

    return WorkspaceExecutionState(
        qubits=qubit_states,
        actors=actor_states,
        bloch_vectors=_build_bloch_vectors(qubits, qubit_index_map, mini_sv),
        measurements=deepcopy(measurements),
        transmissions=deepcopy(transmissions),
    )


def _measure_value(label: str, basis: str, rng: random.Random) -> int:
    if basis == "Z":
        if label == "0":
            return 0
        if label == "1":
            return 1
        return rng.randint(0, 1)

    if label == "+":
        return 0
    if label == "-":
        return 1
    return rng.randint(0, 1)


def _label_from_measurement(basis: str, value: int) -> str:
    if basis == "X":
        return "+" if value == 0 else "-"
    return "0" if value == 0 else "1"


def _handle_measurement(
    instruction: WorkspaceInstruction,
    index: int,
    qubits: dict[str, dict],
    measurements: list[MeasurementRecord],
    warnings: list[str],
    rng: random.Random,
) -> str:
    qubit_id = instruction.qubits[0]
    qubit = _autoinit(qubits, qubit_id, warnings, "MEASURE")
    basis = instruction.basis or "Z"
    value = _measure_value(qubit["state_label"], basis, rng)
    collapsed_label = _label_from_measurement(basis, value)
    partners = list(qubit["entangled_with"])

    _clear_entanglement(qubits, qubit_id)
    _set_state(qubit, collapsed_label)
    qubit["last_operation"] = f"MEASURE[{basis}]"

    for partner_id in partners:
        partner = _ensure_qubit(qubits, partner_id)
        _set_state(partner, collapsed_label)
        partner["last_operation"] = f"COLLAPSE[{basis}]"
        _clear_entanglement(qubits, partner_id)

    measurements.append(
        MeasurementRecord(
            qubit=qubit_id,
            basis=basis,
            value=value,
            actor=qubit["owner"] or qubit["location"],
            step=index,
        )
    )
    return f"{qubit_id} measured in the {basis} basis with result {value}."


def _handle_intercept(
    instruction: WorkspaceInstruction,
    index: int,
    qubits: dict[str, dict],
    actors: dict[str, dict],
    transmissions: list[TransmissionRecord],
    warnings: list[str],
    rng: random.Random,
    mini_sv: _MiniSV,
    qubit_index_map: dict[str, int],
    _sv_index_fn: object = None,
) -> str:
    qubit_id = instruction.qubits[0]
    actor_name = instruction.actors[0]
    _ensure_actor(actors, actor_name)
    qubit = _autoinit(qubits, qubit_id, warnings, "INTERCEPT")

    disturbed = qubit["superposition"] or bool(qubit["entangled_with"])
    if disturbed:
        # Collapse the statevector so Bloch vectors stay in sync
        qi = qubit_index_map.get(qubit_id)
        if mini_sv.active and qi is not None:
            hidden_value = mini_sv.measure_qubit(qi, rng, "Z")
        else:
            hidden_value = _measure_value(qubit["state_label"], "Z", rng)
        partners = list(qubit["entangled_with"])
        _clear_entanglement(qubits, qubit_id)
        _set_state(qubit, "1" if hidden_value == 1 else "0")
        for partner_id in partners:
            partner = _ensure_qubit(qubits, partner_id)
            _set_state(partner, "1" if hidden_value == 1 else "0")
            _clear_entanglement(qubits, partner_id)

    qubit["owner"] = actor_name
    qubit["location"] = actor_name
    qubit["intercepted_by"] = actor_name
    qubit["last_operation"] = "INTERCEPT"
    transmissions.append(
        TransmissionRecord(
            qubit=qubit_id,
            from_actor=None,
            to_actor=actor_name,
            status="intercepted",
            intercepted_by=actor_name,
            step=index,
        )
    )

    if disturbed:
        return f"{actor_name} intercepted {qubit_id} and disturbed its state."
    return f"{actor_name} intercepted {qubit_id} without visible disturbance."


def simulate_workspace(req: WorkspaceSimulateRequest) -> WorkspaceSimulateResponse:
    qubits: dict[str, dict] = {}
    actors: dict[str, dict] = {}
    measurements: list[MeasurementRecord] = []
    transmissions: list[TransmissionRecord] = []
    warnings: list[str] = []
    steps: list[WorkspaceExecutionStep] = []
    rng = random.Random(req.seed)

    # ── Statevector mini-sim setup ──
    mini_sv = _MiniSV()
    qubit_index_map: dict[str, int] = {}
    _next_qubit_index = 0

    def _sv_index(qubit_id: str) -> int:
        """Get or assign a statevector qubit index for the given qubit name."""
        nonlocal _next_qubit_index
        if qubit_id not in qubit_index_map:
            qubit_index_map[qubit_id] = _next_qubit_index
            mini_sv.ensure_qubit(_next_qubit_index)
            _next_qubit_index += 1
        return qubit_index_map[qubit_id]

    for instruction in req.instructions:
        for qubit_id in instruction.qubits:
            _ensure_qubit(qubits, qubit_id)
        for actor_name in instruction.actors:
            _ensure_actor(actors, actor_name)

    # Pre-allocate sv indices for all qubits declared in the program
    for qubit_id in sorted(qubits):
        _sv_index(qubit_id)

    for index, instruction in enumerate(req.instructions):
        opcode = instruction.opcode.upper()
        event = f"Processed {opcode.lower()}."

        if opcode == "ACTOR":
            actor_name = instruction.actors[0]
            _ensure_actor(actors, actor_name)
            event = f"Registered actor {actor_name}."
        elif opcode == "ASSIGN":
            qubit = _ensure_qubit(qubits, instruction.qubits[0])
            actor_name = instruction.actors[0]
            _ensure_actor(actors, actor_name)
            qubit["owner"] = actor_name
            qubit["location"] = actor_name
            qubit["last_operation"] = "ASSIGN"
            event = f"Assigned {qubit['id']} to {actor_name}."
        elif opcode == "INIT":
            qubit = _ensure_qubit(qubits, instruction.qubits[0])
            _clear_entanglement(qubits, qubit["id"])
            init_state = instruction.metadata.get("state", "0")
            mapped = {"0": "0", "1": "1", "+": "+", "-": "-"}
            label = mapped.get(init_state, "0")
            _set_state(qubit, label)
            qubit["last_operation"] = f"INIT[{label}]"
            qubit["intercepted_by"] = None
            # Mirror on statevector
            qi = _sv_index(qubit["id"])
            mini_sv.init_qubit(qi, label)
            event = f"Initialized {qubit['id']} to |{qubit['state_label']}>."
        elif opcode == "RESET":
            qubit = _ensure_qubit(qubits, instruction.qubits[0])
            _clear_entanglement(qubits, qubit["id"])
            _set_state(qubit, "0")
            qubit["last_operation"] = "RESET"
            qi = _sv_index(qubit["id"])
            mini_sv.init_qubit(qi, "0")
            event = f"Reset {qubit['id']} to |0>."
        elif opcode == "H":
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, "H")
            _clear_entanglement(qubits, qubit["id"])
            _apply_h(qubit)
            qubit["last_operation"] = "H"
            mini_sv.apply_h(_sv_index(qubit["id"]))
            event = f"Applied H to {qubit['id']}."
        elif opcode == "X":
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, "X")
            _clear_entanglement(qubits, qubit["id"])
            _apply_x(qubit)
            qubit["last_operation"] = "X"
            mini_sv.apply_x(_sv_index(qubit["id"]))
            event = f"Applied X to {qubit['id']}."
        elif opcode == "Y":
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, "Y")
            _clear_entanglement(qubits, qubit["id"])
            _apply_y(qubit)
            qubit["last_operation"] = "Y"
            mini_sv.apply_y(_sv_index(qubit["id"]))
            event = f"Applied Y to {qubit['id']}."
        elif opcode == "Z":
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, "Z")
            _clear_entanglement(qubits, qubit["id"])
            _apply_z(qubit)
            qubit["last_operation"] = "Z"
            mini_sv.apply_z(_sv_index(qubit["id"]))
            event = f"Applied Z to {qubit['id']}."
        elif opcode in {"S", "T", "SDG", "TDG"}:
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, opcode)
            _clear_entanglement(qubits, qubit["id"])
            _apply_phase_like(qubit)
            qubit["last_operation"] = opcode
            qi = _sv_index(qubit["id"])
            sv_gate = {"S": mini_sv.apply_s, "SDG": mini_sv.apply_sdg, "T": mini_sv.apply_t, "TDG": mini_sv.apply_tdg}
            sv_gate[opcode](qi)
            event = f"Applied {opcode} to {qubit['id']} using simplified phase logic."
        elif opcode == "SX":
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, "SX")
            _clear_entanglement(qubits, qubit["id"])
            _apply_sx(qubit)
            qubit["last_operation"] = "SX"
            mini_sv.apply_sx(_sv_index(qubit["id"]))
            event = f"Applied SX to {qubit['id']} using simplified superposition logic."
        elif opcode in {"RX", "RY", "RZ"}:
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, opcode)
            _clear_entanglement(qubits, qubit["id"])
            rotation_note = _apply_rotation(qubit, opcode, _normalized_angle(instruction))
            qubit["last_operation"] = opcode
            angle = _normalized_angle(instruction)
            qi = _sv_index(qubit["id"])
            if opcode == "RX":
                mini_sv.apply_rx(qi, angle)
            elif opcode == "RY":
                mini_sv.apply_ry(qi, angle)
            else:
                mini_sv.apply_rz(qi, angle)
            event = f"Applied {opcode} to {qubit['id']}. {rotation_note}"
        elif opcode == "SWAP":
            left = _autoinit(qubits, instruction.qubits[0], warnings, "SWAP")
            right = _autoinit(qubits, instruction.qubits[1], warnings, "SWAP")
            keys = ["initialized", "state_label", "superposition", "owner", "location", "intercepted_by", "last_operation"]
            left_values = {key: left[key] for key in keys}
            for key in keys:
                left[key] = right[key]
                right[key] = left_values[key]
            left["last_operation"] = "SWAP"
            right["last_operation"] = "SWAP"
            mini_sv.apply_swap(_sv_index(left["id"]), _sv_index(right["id"]))
            event = f"Swapped the runtime states of {left['id']} and {right['id']}."
        elif opcode == "CNOT":
            control = _autoinit(qubits, instruction.qubits[0], warnings, "CNOT")
            target = _autoinit(qubits, instruction.qubits[1], warnings, "CNOT")
            if control["state_label"] in {"+", "-", "mixed"} or target["state_label"] in {"+", "-", "mixed"} or control["entangled_with"] or target["entangled_with"]:
                _clear_entanglement(qubits, control["id"])
                _clear_entanglement(qubits, target["id"])
                _set_state(control, "mixed")
                _set_state(target, "mixed")
                control["entangled_with"] = [target["id"]]
                target["entangled_with"] = [control["id"]]
                control["last_operation"] = "CNOT"
                target["last_operation"] = "CNOT"
                event = f"Linked {control['id']} and {target['id']} with a simplified entanglement relation."
            elif control["state_label"] == "1":
                _apply_x(target)
                control["last_operation"] = "CNOT"
                target["last_operation"] = "CNOT"
                event = f"CNOT flipped {target['id']} because {control['id']} was |1>."
            else:
                control["last_operation"] = "CNOT"
                target["last_operation"] = "CNOT"
                event = f"CNOT left {target['id']} unchanged because {control['id']} was |0>."
            mini_sv.apply_cnot(_sv_index(control["id"]), _sv_index(target["id"]))
        elif opcode == "CZ":
            control = _autoinit(qubits, instruction.qubits[0], warnings, "CZ")
            target = _autoinit(qubits, instruction.qubits[1], warnings, "CZ")
            if control["state_label"] in {"+", "-", "mixed"} or target["state_label"] in {"+", "-", "mixed"} or control["entangled_with"] or target["entangled_with"]:
                _link_group(qubits, [control["id"], target["id"]])
                control["last_operation"] = "CZ"
                target["last_operation"] = "CZ"
                event = f"CZ linked {control['id']} and {target['id']} through simplified phase entanglement."
            elif control["state_label"] == "1":
                _apply_phase_like(target)
                control["last_operation"] = "CZ"
                target["last_operation"] = "CZ"
                event = f"CZ applied a conditional phase to {target['id']}."
            else:
                control["last_operation"] = "CZ"
                target["last_operation"] = "CZ"
                event = f"CZ left {target['id']} unchanged because {control['id']} was |0>."
            mini_sv.apply_cz(_sv_index(control["id"]), _sv_index(target["id"]))
        elif opcode == "TOFFOLI":
            control_a = _autoinit(qubits, instruction.qubits[0], warnings, "TOFFOLI")
            control_b = _autoinit(qubits, instruction.qubits[1], warnings, "TOFFOLI")
            target = _autoinit(qubits, instruction.qubits[2], warnings, "TOFFOLI")
            if any(
                qubit["state_label"] in {"+", "-", "mixed"} or qubit["entangled_with"]
                for qubit in (control_a, control_b, target)
            ):
                _link_group(qubits, [control_a["id"], control_b["id"], target["id"]])
                control_a["last_operation"] = "TOFFOLI"
                control_b["last_operation"] = "TOFFOLI"
                target["last_operation"] = "TOFFOLI"
                event = f"TOFFOLI created a simplified three-qubit correlation among {control_a['id']}, {control_b['id']}, and {target['id']}."
            elif control_a["state_label"] == "1" and control_b["state_label"] == "1":
                _apply_x(target)
                control_a["last_operation"] = "TOFFOLI"
                control_b["last_operation"] = "TOFFOLI"
                target["last_operation"] = "TOFFOLI"
                event = f"TOFFOLI flipped {target['id']} because both controls were |1>."
            else:
                control_a["last_operation"] = "TOFFOLI"
                control_b["last_operation"] = "TOFFOLI"
                target["last_operation"] = "TOFFOLI"
                event = f"TOFFOLI left {target['id']} unchanged because both controls were not |1>."
            mini_sv.apply_toffoli(_sv_index(control_a["id"]), _sv_index(control_b["id"]), _sv_index(target["id"]))
        elif opcode == "MEASURE":
            # Use the mini-sv measurement outcome for consistency
            qubit_id = instruction.qubits[0]
            qi = _sv_index(qubit_id)
            basis = instruction.basis or "Z"
            # Collapse in the correct basis (X-basis applies H→Z→H internally)
            sv_outcome = mini_sv.measure_qubit(qi, rng, basis)
            # Now run the symbolic side with the same outcome
            qubit = _autoinit(qubits, qubit_id, warnings, "MEASURE")
            collapsed_label = _label_from_measurement(basis, sv_outcome)
            partners = list(qubit["entangled_with"])
            _clear_entanglement(qubits, qubit_id)
            _set_state(qubit, collapsed_label)
            qubit["last_operation"] = f"MEASURE[{basis}]"
            for partner_id in partners:
                partner = _ensure_qubit(qubits, partner_id)
                _set_state(partner, collapsed_label)
                partner["last_operation"] = f"COLLAPSE[{basis}]"
                _clear_entanglement(qubits, partner_id)
            measurements.append(
                MeasurementRecord(
                    qubit=qubit_id,
                    basis=basis,
                    value=sv_outcome,
                    actor=qubit["owner"] or qubit["location"],
                    step=index,
                )
            )
            event = f"{qubit_id} measured in the {basis} basis with result {sv_outcome}."
        elif opcode == "SEND":
            qubit = _autoinit(qubits, instruction.qubits[0], warnings, "SEND")
            from_actor, to_actor = instruction.actors[0], instruction.actors[1]
            _ensure_actor(actors, from_actor)
            _ensure_actor(actors, to_actor)
            qubit["owner"] = to_actor
            qubit["location"] = to_actor
            qubit["last_operation"] = "SEND"
            transmissions.append(
                TransmissionRecord(
                    qubit=qubit["id"],
                    from_actor=from_actor,
                    to_actor=to_actor,
                    status="sent",
                    intercepted_by=qubit["intercepted_by"],
                    step=index,
                )
            )
            event = f"Sent {qubit['id']} from {from_actor} to {to_actor}."
        elif opcode == "INTERCEPT":
            event = _handle_intercept(instruction, index, qubits, actors, transmissions, warnings, rng, mini_sv, qubit_index_map)
        elif opcode in {"LABEL", "NOTE", "WAIT", "BARRIER"}:
            event = instruction.label or instruction.raw
        else:
            warnings.append(f"Unsupported backend opcode {opcode}; skipped.")
            event = f"Skipped unsupported opcode {opcode}."

        steps.append(
            WorkspaceExecutionStep(
                index=index,
                instruction=instruction,
                event=event,
                state=_snapshot(qubits, actors, measurements, transmissions, qubit_index_map, mini_sv),
            )
        )

    final_state = steps[-1].state if steps else _snapshot(qubits, actors, measurements, transmissions, qubit_index_map, mini_sv)

    return WorkspaceSimulateResponse(
        summary=WorkspaceSummary(
            qubits=sorted(qubits),
            actors=sorted(actors),
            total_steps=len(req.instructions),
            measurements=len(measurements),
        ),
        steps=steps,
        final_state=final_state,
        measurement_results=measurements,
        warnings=warnings,
    )
