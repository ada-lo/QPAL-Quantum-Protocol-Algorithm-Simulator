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


def _invalid_instruction(line_number: int, message: str) -> ValueError:
    return ValueError(f"Line {line_number}: {message}")


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
            try:
                duration = float(rest[0]) if rest else 1
            except ValueError:
                raise ValueError(f"Invalid duration for WAIT: {rest[0]}")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                category="annotation", metadata={"duration": duration},
            ))
            continue

        # ── Actor ──
        if opcode == "ACTOR":
            if len(rest) != 1 or not _validate_actor(rest[0]):
                raise _invalid_instruction(line_number, "ACTOR expects a single valid actor name.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                actors=[rest[0]], category="actor",
            ))
            continue

        # ── INIT ──
        if opcode == "INIT":
            if len(rest) < 1 or len(rest) > 2:
                raise _invalid_instruction(line_number, "INIT expects `INIT qN` or `INIT qN <state>`.")
            qubit = rest[0]
            state = rest[1] if len(rest) == 2 else "0"
            if not _validate_qubit(qubit):
                raise _invalid_instruction(line_number, f"Invalid qubit name `{qubit}` for INIT.")
            if state not in _INIT_STATES:
                raise _invalid_instruction(line_number, f"Invalid INIT state `{state}`. Expected one of {sorted(_INIT_STATES)}.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[qubit], category="quantum", metadata={"state": state},
            ))
            continue

        # ── RESET ──
        if opcode == "RESET":
            if len(rest) != 1 or not _validate_qubit(rest[0]):
                raise _invalid_instruction(line_number, "RESET expects a single valid qubit name.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[rest[0]], category="quantum",
            ))
            continue

        # ── Single-qubit gates ──
        if opcode in _SINGLE_QUBIT_GATES:
            if len(rest) != 1 or not _validate_qubit(rest[0]):
                raise _invalid_instruction(line_number, f"{opcode} expects a single valid qubit name.")
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
                raise _invalid_instruction(line_number, f"{opcode} expects `QUBIT ANGLE`.")
            qubit, angle_tok = rest
            if not _validate_qubit(qubit):
                raise _invalid_instruction(line_number, f"Invalid qubit name `{qubit}` for {opcode}.")
            if not _ANGLE_RE.match(angle_tok):
                raise _invalid_instruction(line_number, f"Invalid angle `{angle_tok}` for {opcode}.")
            angle = float(angle_tok)
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[qubit], category="quantum", metadata={"angle": angle},
            ))
            continue

        # ── Two-qubit ops ──
        if opcode in _TWO_QUBIT_OPS:
            if len(rest) != 2:
                raise _invalid_instruction(line_number, f"{opcode} expects exactly two qubit operands.")
            left, right = rest
            if not _validate_qubit(left) or not _validate_qubit(right):
                raise _invalid_instruction(line_number, f"{opcode} expects valid qubit names like q0 q1.")
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
                raise _invalid_instruction(line_number, "TOFFOLI expects exactly three qubit operands.")
            if not all(_validate_qubit(q) for q in rest):
                raise _invalid_instruction(line_number, "TOFFOLI expects valid qubit names like q0 q1 q2.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=list(rest), category="quantum",
            ))
            continue

        # ── MEASURE ──
        if opcode == "MEASURE":
            if len(rest) < 1 or not _validate_qubit(rest[0]):
                raise _invalid_instruction(line_number, "MEASURE expects a valid qubit name.")
            qubit = rest[0]
            basis, _ = _parse_measure_basis(rest[1:])
            if basis is None:
                raise _invalid_instruction(line_number, "MEASURE basis must be X or Z when provided.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[qubit], basis=basis, category="quantum",
            ))
            continue

        # ── ASSIGN ──
        if opcode == "ASSIGN":
            if len(rest) != 2 or not _validate_qubit(rest[0]) or not _validate_actor(rest[1]):
                raise _invalid_instruction(line_number, "ASSIGN expects `ASSIGN qN ActorName`.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[rest[0]], actors=[rest[1]], category="actor",
            ))
            continue

        # ── SEND ──
        if opcode == "SEND":
            if len(rest) != 3 or not _validate_qubit(rest[0]) or not _validate_actor(rest[1]) or not _validate_actor(rest[2]):
                raise _invalid_instruction(line_number, "SEND expects `SEND qN FromActor ToActor`.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[rest[0]], actors=[rest[1], rest[2]], category="transport",
            ))
            continue

        # ── INTERCEPT ──
        if opcode == "INTERCEPT":
            if len(rest) != 2 or not _validate_qubit(rest[0]) or not _validate_actor(rest[1]):
                raise _invalid_instruction(line_number, "INTERCEPT expects `INTERCEPT qN ActorName`.")
            instructions.append(WorkspaceInstruction(
                line=line_number, raw=raw, opcode=opcode, args=rest,
                qubits=[rest[0]], actors=[rest[1]], category="transport",
            ))
            continue

        # ── Unknown opcode — strict, no silent skips ──
        raise ValueError(f"Unrecognized instruction: {opcode} on line {line_number}")

    return instructions
