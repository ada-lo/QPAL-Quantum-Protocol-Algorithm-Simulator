"""
QuNetSim execution engine.

Executes user-supplied Python code in a controlled local namespace,
intercepts QuNetSim network events via monkey-patched send/receive hooks,
and returns a WorkspaceSimulateResponse for the QPAL 3D studio.
"""
from __future__ import annotations

import io
import sys
import traceback
from contextlib import redirect_stdout
from typing import Any

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


# ── Log event accumulator ─────────────────────────────────────────────────────

class _NetworkLog:
    """Collects host/qubit events emitted during the user's QuNetSim script."""

    def __init__(self) -> None:
        self.events: list[dict[str, Any]] = []
        self.transmissions: list[TransmissionRecord] = []
        self.measurements: list[MeasurementRecord] = []
        self.actors: set[str] = set()
        self.qubits: set[str] = set()

    def add_host(self, name: str) -> None:
        self.actors.add(name)
        self.events.append({"type": "host_created", "host": name})

    def add_send(self, sender: str, receiver: str, qubit_id: str, step: int) -> None:
        self.qubits.add(qubit_id)
        self.transmissions.append(TransmissionRecord(
            qubit=qubit_id,
            from_actor=sender,
            to_actor=receiver,
            status="sent",
            intercepted_by=None,
            step=step,
        ))
        self.events.append({
            "type": "send",
            "from": sender,
            "to": receiver,
            "qubit": qubit_id,
            "step": step,
        })

    def add_measure(self, host: str, qubit_id: str, result: int, step: int) -> None:
        self.qubits.add(qubit_id)
        self.measurements.append(MeasurementRecord(
            qubit=qubit_id,
            basis="Z",
            value=result,
            actor=host,
            step=step,
        ))
        self.events.append({
            "type": "measure",
            "host": host,
            "qubit": qubit_id,
            "result": result,
            "step": step,
        })


def _build_execution_state(actors: set[str], qubits: set[str],
                            transmissions: list[TransmissionRecord],
                            measurements: list[MeasurementRecord]) -> WorkspaceExecutionState:
    actor_states = [WorkspaceActorState(name=a, owned_qubits=[]) for a in sorted(actors)]
    qubit_states = [
        WorkspaceQubitState(
            id=q, initialized=True, state_label="mixed", superposition=True,
            owner=None, location=None, entangled_with=[], intercepted_by=None,
            last_operation=None,
        )
        for q in sorted(qubits)
    ]
    bloch_vectors = [
        WorkspaceBlochVector(qubit=q, x=0.0, y=0.0, z=0.0, purity=0.0)
        for q in sorted(qubits)
    ]
    return WorkspaceExecutionState(
        qubits=qubit_states,
        actors=actor_states,
        bloch_vectors=bloch_vectors,
        measurements=measurements,
        transmissions=transmissions,
    )


# ── Instrumented namespace stubs ──────────────────────────────────────────────
# These lightweight Python classes mirror QuNetSim's API so the user's script
# runs even if QuNetSim isn't installed, and also when it IS installed we wrap
# critical methods to capture events for the step viewer.

class _StubQubit:
    _counter = 0

    def __init__(self, host: "_StubHost", *, log: _NetworkLog, step_ref: list[int]) -> None:
        _StubQubit._counter += 1
        self._id = f"q{_StubQubit._counter}"
        self._host = host
        self._log = log
        self._step_ref = step_ref
        self._state = "|0⟩"
        log.qubits.add(self._id)

    # Gate stubs
    def H(self):  self._state = "|+⟩"
    def X(self):  self._state = "|1⟩" if self._state == "|0⟩" else "|0⟩"
    def Z(self):  pass
    def T(self):  pass
    def S(self):  pass
    def CNOT(self, target: "_StubQubit"): target._state = "|mixed⟩"

    def measure(self) -> int:
        import random
        result = random.randint(0, 1)
        self._log.add_measure(self._host.host_id, self._id, result, self._step_ref[0])
        self._step_ref[0] += 1
        return result


class _StubHost:
    def __init__(self, host_id: str, *, log: _NetworkLog, step_ref: list[int]) -> None:
        self.host_id = host_id
        self._log = log
        self._step_ref = step_ref
        log.add_host(host_id)

    def send_qubit(self, receiver_id: str, qubit: _StubQubit, await_ack: bool = False) -> None:
        self._log.add_send(self.host_id, receiver_id, qubit._id, self._step_ref[0])
        self._step_ref[0] += 1

    def send_epr(self, receiver_id: str) -> None:
        stub_q = _StubQubit(self, log=self._log, step_ref=self._step_ref)
        stub_q.H()
        self._log.add_send(self.host_id, receiver_id, stub_q._id, self._step_ref[0])
        self._step_ref[0] += 1

    def send_superdense(self, receiver_id: str, message: str) -> None:
        stub_q = _StubQubit(self, log=self._log, step_ref=self._step_ref)
        self._log.add_send(self.host_id, receiver_id, stub_q._id, self._step_ref[0])
        self._step_ref[0] += 1

    def get_qubit(self, sender_id: str, wait: float = 0) -> _StubQubit | None:
        return _StubQubit(self, log=self._log, step_ref=self._step_ref)

    def add_c_connection(self, other: "_StubHost") -> None: pass
    def add_connection(self, other: "_StubHost") -> None: pass
    def start(self) -> None: pass


class _StubNetwork:
    _instance: "_StubNetwork | None" = None

    def __init__(self, *, log: _NetworkLog) -> None:
        self._log = log

    @classmethod
    def get_instance(cls) -> "_StubNetwork":
        if cls._instance is None:
            cls._instance = cls(log=_NetworkLog())
        return cls._instance

    def add_hosts(self, hosts: list[_StubHost]) -> None:
        for h in hosts:
            self._log.add_host(h.host_id)

    def start(self) -> None: pass
    def stop(self, stop_hosts: bool = True) -> None: pass


# ── Main engine ────────────────────────────────────────────────────────────────

def execute_qunetsim(req: WorkspaceSimulateRequest) -> WorkspaceSimulateResponse:
    """Execute a QuNetSim Python script in a sandboxed namespace."""
    log = _NetworkLog()
    step_ref = [0]  # mutable step counter shared across stubs
    _StubQubit._counter = 0
    _StubNetwork._instance = None

    # Build a safe execution namespace that intercepts QuNetSim calls
    def make_Host(host_id: str) -> _StubHost:
        return _StubHost(host_id, log=log, step_ref=step_ref)

    def make_Qubit(host: _StubHost) -> _StubQubit:
        return _StubQubit(host, log=log, step_ref=step_ref)

    def make_Network() -> type:
        class _NS:  # namespace wrapper so `Network.get_instance()` works
            @staticmethod
            def get_instance() -> _StubNetwork:
                n = _StubNetwork(log=log)
                _StubNetwork._instance = n
                return n
        return _NS

    # Try to inject real QuNetSim if installed, falling back to stubs
    try:
        import qunetsim  # noqa: F401
        from qunetsim.components import Host as RealHost, Network as RealNetwork
        from qunetsim.objects import Qubit as RealQubit

        # Wrap RealHost to capture events
        class _WrappedHost(RealHost):  # type: ignore[misc]
            def __init__(self, host_id: str) -> None:
                super().__init__(host_id)
                log.add_host(host_id)
            def send_qubit(self, receiver_id, qubit, await_ack=False, no_ack=False):  # type: ignore[override]
                log.add_send(self.host_id, receiver_id, str(id(qubit)), step_ref[0])
                step_ref[0] += 1
                return super().send_qubit(receiver_id, qubit, await_ack=await_ack)

        exec_ns: dict[str, Any] = {
            "Host": _WrappedHost,
            "Network": RealNetwork,
            "Qubit": RealQubit,
        }
    except (ImportError, Exception):
        exec_ns = {
            "Host": make_Host,
            "Qubit": make_Qubit,
            "Network": make_Network(),
        }

    # Restricted builtins — no file I/O, no __import__, no eval/exec
    _SAFE_BUILTINS = {
        "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool,
        "chr": chr, "complex": complex, "dict": dict, "divmod": divmod,
        "enumerate": enumerate, "filter": filter, "float": float,
        "format": format, "frozenset": frozenset, "hash": hash, "hex": hex,
        "id": id, "int": int, "isinstance": isinstance, "issubclass": issubclass,
        "iter": iter, "len": len, "list": list, "map": map, "max": max, "min": min,
        "next": next, "oct": oct, "ord": ord, "pow": pow, "print": print,
        "range": range, "repr": repr, "reversed": reversed, "round": round,
        "set": set, "slice": slice, "sorted": sorted, "str": str, "sum": sum,
        "tuple": tuple, "type": type, "zip": zip,
        "True": True, "False": False, "None": None,
    }

    exec_ns.update({
        "__builtins__": _SAFE_BUILTINS,
    })

    stdout_buf = io.StringIO()
    warnings: list[str] = []

    try:
        with redirect_stdout(stdout_buf):
            exec(compile(req.code, "<qunetsim_script>", "exec"), exec_ns)
    except SystemExit:
        pass  # scripts that call sys.exit() are fine
    except Exception as exc:
        tb = traceback.format_exc()
        warnings.append(f"Script error: {exc}\n{tb}")

    stdout_output = stdout_buf.getvalue()
    if stdout_output.strip():
        warnings.append(f"Script stdout:\n{stdout_output.strip()}")

    # ── Build steps from captured events ─────────────────────────────────────
    steps: list[WorkspaceExecutionStep] = []
    cumulative_actors: set[str] = set()
    cumulative_qubits: set[str] = set()
    cumulative_tx: list[TransmissionRecord] = []
    cumulative_mx: list[MeasurementRecord] = []

    for step_idx, event in enumerate(log.events):
        et = event["type"]
        if et == "host_created":
            cumulative_actors.add(event["host"])
            event_label = f"Registered host '{event['host']}'."
        elif et == "send":
            cumulative_actors.update([event["from"], event["to"]])
            cumulative_qubits.add(event["qubit"])
            tx = TransmissionRecord(
                qubit=event["qubit"],
                from_actor=event["from"],
                to_actor=event["to"],
                status="sent",
                intercepted_by=None,
                step=step_idx,
            )
            cumulative_tx.append(tx)
            event_label = f"{event['from']} sent qubit {event['qubit']} to {event['to']}."
        elif et == "measure":
            cumulative_qubits.add(event["qubit"])
            mx = MeasurementRecord(
                qubit=event["qubit"],
                basis="Z",
                value=event["result"],
                actor=event["host"],
                step=step_idx,
            )
            cumulative_mx.append(mx)
            event_label = f"{event['host']} measured {event['qubit']} → {event['result']}."
        else:
            event_label = str(event)

        state_snapshot = _build_execution_state(
            cumulative_actors,
            cumulative_qubits,
            list(cumulative_tx),
            list(cumulative_mx),
        )
        dummy_instr = WorkspaceInstruction(
            line=step_idx + 1,
            raw=event_label,
            opcode=et.upper(),
            args=[],
            qubits=sorted(cumulative_qubits),
            actors=sorted(cumulative_actors),
            category="transport" if et == "send" else "actor",
            metadata={},
        )
        steps.append(WorkspaceExecutionStep(
            index=step_idx,
            instruction=dummy_instr,
            event=event_label,
            state=state_snapshot,
        ))

    final_state = _build_execution_state(
        log.actors, log.qubits, log.transmissions, log.measurements
    )

    summary = WorkspaceSummary(
        qubits=sorted(log.qubits),
        actors=sorted(log.actors),
        total_steps=len(steps),
        measurements=len(log.measurements),
    )

    return WorkspaceSimulateResponse(
        engine="qunetsim",
        summary=summary,
        steps=steps,
        final_state=final_state,
        measurement_results=log.measurements,
        warnings=warnings,
    )
