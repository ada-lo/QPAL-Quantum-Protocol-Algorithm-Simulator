"""QPAL pseudocode parser — Python port of the frontend pseudoParser.ts.

Converts raw QPAL custom pseudocode text into a list of WorkspaceInstruction
objects that the executor can run directly.
"""
from __future__ import annotations

import re
from typing import List

from api.schemas.workspace import WorkspaceInstruction

_COMMENT_RE = [re.compile(r"^\s*#"), re.compile(r"^\s*//")]
_QUBIT_RE = re.compile(r"^q\d+$", re.IGNORECASE)
_ACTOR_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_-]*$")
_ANGLE_RE = re.compile(r"^[-+]?(\d+(\.\d+)?|\.\d+)$")
_INIT_STATES = {"0", "1", "+", "-"}

_SINGLE_QUBIT_GATES = {"H", "X", "Y", "Z", "S", "T", "SDG", "TDG", "SX", "SUPERPOSE"}
_ROTATION_GATES = {"RX", "RY", "RZ"}
_TWO_QUBIT_OPS = {"CNOT", "SWAP", "CZ", "BELL", "ENTANGLE"}


def _is_comment(line: str) -> bool:
    return any(p.search(line) for p in _COMMENT_RE)


def _validate_qubit(token: str) -> bool:
    return bool(_QUBIT_RE.match(token))


def _validate_actor(token: str) -> bool:
    return bool(_ACTOR_RE.match(token))


def _expand_macro(line: int, raw: str, opcode: str, qubits: List[str]) -> List[WorkspaceInstruction]:
    if opcode == "SUPERPOSE":
        return [
            WorkspaceInstruction(
                line=line, raw=raw, opcode="H", args=[qubits[0]],
                qubits=[qubits[0]], category="quantum",
                metadata={"expanded_from": "SUPERPOSE"},
            ),
        ]

    if opcode == "ENTANGLE":
        return [
            WorkspaceInstruction(
                line=line, raw=raw, opcode="H", args=[qubits[0]],
                qubits=[qubits[0]], category="quantum",
                metadata={"expanded_from": "ENTANGLE"},
            ),
            WorkspaceInstruction(
                line=line, raw=raw, opcode="CNOT", args=[qubits[0], qubits[1]],
                qubits=[qubits[0], qubits[1]], category="quantum",
                metadata={"expanded_from": "ENTANGLE"},
            ),
        ]

    # BELL
    return [
        WorkspaceInstruction(line=line, raw=raw, opcode="INIT", args=[qubits[0]], qubits=[qubits[0]], category="quantum", metadata={"state": "0", "expanded_from": "BELL"}),
        WorkspaceInstruction(line=line, raw=raw, opcode="INIT", args=[qubits[1]], qubits=[qubits[1]], category="quantum", metadata={"state": "0", "expanded_from": "BELL"}),
        WorkspaceInstruction(line=line, raw=raw, opcode="H", args=[qubits[0]], qubits=[qubits[0]], category="quantum", metadata={"expanded_from": "BELL"}),
        WorkspaceInstruction(line=line, raw=raw, opcode="CNOT", args=[qubits[0], qubits[1]], qubits=[qubits[0], qubits[1]], category="quantum", metadata={"expanded_from": "BELL"}),
    ]


def _parse_measure_basis(tokens: List[str]) -> tuple[str | None, int]:
    cleaned = [t.strip("[]").upper() for t in tokens]
    if not cleaned:
        return "Z", 0
    if cleaned[0] == "BASIS" and len(cleaned) > 1 and cleaned[1] in ("X", "Z"):
        return cleaned[1], 2
    if cleaned[0] in ("X", "Z"):
        return cleaned[0], 1
    return None, 0


def parse_pseudocode(source: str) -> List[WorkspaceInstruction]:
    """Parse QPAL pseudocode text and return a list of WorkspaceInstruction."""
    instructions: List[WorkspaceInstruction] = []

    for index, raw_line in enumerate(source.split("\n")):
        line_number = index + 1
        normalized = raw_line.replace(",", " ").strip()

        if not normalized or _is_comment(normalized):
            continue

        parts = normalized.split()
        opcode = parts[0].upper()
        rest = parts[1:]
        raw = raw_line.strip()

        # ── Annotations ──
        if opcode in ("NOTE", "LABEL"):
            text = " ".join(rest).strip()
            if not text:
                continue
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                label=text, category="annotation",
            ))
            continue

        if opcode == "BARRIER":
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, category="annotation",
            ))
            continue

        if opcode == "WAIT":
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                category="annotation", metadata={"duration": float(rest[0]) if rest else 1},
            ))
            continue

        # ── Actor ──
        if opcode == "ACTOR":
            if len(rest) == 1 and _validate_actor(rest[0]):
                instructions.append(WorkspaceInstruction(
                    line=line_number, raw=raw, opcode=opcode, args=rest,
                    actors=[rest[0]], category="actor",
                ))
            continue

        # ── INIT ──
        if opcode == "INIT":
            if len(rest) < 1 or len(rest) > 2:
                continue
            qubit = rest[0]
            state = rest[1] if len(rest) == 2 else "0"
            if not _validate_qubit(qubit) or state not in _INIT_STATES:
                continue
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[qubit], category="quantum", metadata={"state": state},
            ))
            continue

        # ── RESET ──
        if opcode == "RESET":
            if len(rest) == 1 and _validate_qubit(rest[0]):
                instructions.append(WorkspaceInstruction(
                    line=line_number, raw=raw, opcode=opcode, args=rest,
                    qubits=[rest[0]], category="quantum",
                ))
            continue

        # ── Single-qubit gates ──
        if opcode in _SINGLE_QUBIT_GATES:
            if len(rest) != 1 or not _validate_qubit(rest[0]):
                continue
            qubit = rest[0]
            if opcode == "SUPERPOSE":
                instructions.extend(_expand_macro(line_number, raw, opcode, [qubit]))
                continue
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[qubit], category="quantum",
            ))
            continue

        # ── Rotation gates ──
        if opcode in _ROTATION_GATES:
            if len(rest) != 2:
                continue
            qubit, angle_tok = rest
            if not _validate_qubit(qubit) or not _ANGLE_RE.match(angle_tok):
                continue
            angle = float(angle_tok)
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[qubit], category="quantum", metadata={"angle": angle},
            ))
            continue

        # ── Two-qubit ops ──
        if opcode in _TWO_QUBIT_OPS:
            if len(rest) != 2:
                continue
            left, right = rest
            if not _validate_qubit(left) or not _validate_qubit(right):
                continue
            if opcode in ("BELL", "ENTANGLE"):
                instructions.extend(_expand_macro(line_number, raw, opcode, [left, right]))
                continue
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[left, right], category="quantum",
            ))
            continue

        # ── TOFFOLI ──
        if opcode == "TOFFOLI":
            if len(rest) != 3:
                continue
            if all(_validate_qubit(q) for q in rest):
                instructions.append(WorkspaceInstruction(
                    line=line_number, raw=raw, opcode=opcode, args=rest,
                    qubits=list(rest), category="quantum",
                ))
            continue

        # ── MEASURE ──
        if opcode == "MEASURE":
            if len(rest) < 1 or not _validate_qubit(rest[0]):
                continue
            qubit = rest[0]
            basis, _ = _parse_measure_basis(rest[1:])
            if basis is None:
                basis = "Z"
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[qubit], basis=basis, category="quantum",
            ))
            continue

        # ── ASSIGN ──
        if opcode == "ASSIGN":
            if len(rest) == 2 and _validate_qubit(rest[0]) and _validate_actor(rest[1]):
                instructions.append(WorkspaceInstruction(
                    line=line_number, raw=raw, opcode=opcode, args=rest,
                    qubits=[rest[0]], actors=[rest[1]], category="actor",
                ))
            continue

        # ── SEND ──
        if opcode == "SEND":
            if len(rest) == 3 and _validate_qubit(rest[0]) and _validate_actor(rest[1]) and _validate_actor(rest[2]):
                instructions.append(WorkspaceInstruction(
                    line=line_number, raw=raw, opcode=opcode, args=rest,
                    qubits=[rest[0]], actors=[rest[1], rest[2]], category="transport",
                ))
            continue

        # ── INTERCEPT ──
        if opcode == "INTERCEPT":
            if len(rest) == 2 and _validate_qubit(rest[0]) and _validate_actor(rest[1]):
                instructions.append(WorkspaceInstruction(
                    line=line_number, raw=raw, opcode=opcode, args=rest,
                    qubits=[rest[0]], actors=[rest[1]], category="transport",
                ))
            continue

        # Unknown opcode — skip silently (same as frontend behavior for unknown)

    return instructions
