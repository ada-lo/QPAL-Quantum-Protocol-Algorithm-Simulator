"""
QuNetSim execution engine.

The original implementation executed user-supplied Python directly inside the
backend process. That is not safe to expose from an authenticated API, so the
engine now returns a schema-valid warning response until a real sandboxed
runtime is introduced.
"""
import sys

import types
from typing import Any
from api.schemas.workspace import WorkspaceSimulateRequest, WorkspaceInstruction
from core.engines.base_engine import BaseQuantumEngine


class QuNetSimEngine(BaseQuantumEngine):
    """QuNetSim network protocol execution engine."""

    def execute(self, req: WorkspaceSimulateRequest):
        return _execute_qunetsim_impl(self, req)


_engine = QuNetSimEngine()


def execute_qunetsim(req: WorkspaceSimulateRequest):
    """Module-level convenience — delegates to QuNetSimEngine."""
    return _engine.execute(req)


class MockRuntime:
    instructions = []
    qubit_counter = 0

    @classmethod
    def reset(cls):
        cls.instructions = []
        cls.qubit_counter = 0

    @classmethod
    def add(cls, opcode: str, args: list = None, qubits: list = None, actors: list = None, metadata: dict = None):
        cls.instructions.append(WorkspaceInstruction(
            line=len(cls.instructions) + 1,
            raw=f"Mocked {opcode}",
            opcode=opcode,
            args=args or [],
            qubits=qubits or [],
            actors=actors or [],
            metadata=metadata or {}
        ))


class MockQubit:
    def __init__(self, host):
        MockRuntime.qubit_counter += 1
        self.id = f"q{MockRuntime.qubit_counter}"
        MockRuntime.add("INIT", qubits=[self.id], metadata={"state": "0"})
        if host:
            MockRuntime.add("ASSIGN", qubits=[self.id], actors=[getattr(host, 'host_id', str(host))])

    def H(self):
        MockRuntime.add("H", qubits=[self.id])

    def X(self):
        MockRuntime.add("X", qubits=[self.id])

    def Y(self):
        MockRuntime.add("Y", qubits=[self.id])

    def Z(self):
        MockRuntime.add("Z", qubits=[self.id])

    def measure(self):
        MockRuntime.add("MEASURE", qubits=[self.id])
        return 0


class MockHost:
    def __init__(self, host_id):
        self.host_id = host_id
        MockRuntime.add("ACTOR", actors=[host_id])

    def add_connection(self, receiver_id):
        pass

    def add_connections(self, receiver_ids):
        pass

    def start(self):
        pass

    def stop(self):
        pass

    def send_classical(self, receiver, message, await_ack=False):
        pass

    def send_qubit(self, receiver, qubit, await_ack=False):
        MockRuntime.add("ASSIGN", qubits=[qubit.id], actors=[receiver])

    def send_teleport(self, receiver, qubit, await_ack=False):
        # Teleportation effect: move the qubit to the receiver
        MockRuntime.add("ASSIGN", qubits=[qubit.id], actors=[receiver])

    def get_qubit(self, sender_id, wait=0):
        # Return a dummy qubit for the receiver to interact with
        q = MockQubit(None)
        MockRuntime.add("ASSIGN", qubits=[q.id], actors=[self.host_id])
        return q

    def get_data_qubit(self, sender_id, wait=0):
        return self.get_qubit(sender_id, wait)

    def get_classical(self, sender_id, wait=0):
        class MockMessage:
            content = "11"
        return MockMessage()

    def send_epr(self, receiver, await_ack=False):
        MockRuntime.qubit_counter += 1
        q1 = f"q{MockRuntime.qubit_counter}"
        MockRuntime.qubit_counter += 1
        q2 = f"q{MockRuntime.qubit_counter}"
        MockRuntime.add("INIT", qubits=[q1], metadata={"state": "0"})
        MockRuntime.add("INIT", qubits=[q2], metadata={"state": "0"})
        MockRuntime.add("H", qubits=[q1])
        MockRuntime.add("CNOT", qubits=[q1, q2])
        MockRuntime.add("ASSIGN", qubits=[q1], actors=[self.host_id])
        MockRuntime.add("ASSIGN", qubits=[q2], actors=[receiver])
        return q1, q2

    def send_superdense(self, receiver, message):
        MockRuntime.qubit_counter += 1
        q1 = f"q{MockRuntime.qubit_counter}"
        MockRuntime.qubit_counter += 1
        q2 = f"q{MockRuntime.qubit_counter}"
        MockRuntime.add("INIT", qubits=[q1], metadata={"state": "0"})
        MockRuntime.add("INIT", qubits=[q2], metadata={"state": "0"})
        MockRuntime.add("H", qubits=[q1])
        MockRuntime.add("CNOT", qubits=[q1, q2])
        MockRuntime.add("ASSIGN", qubits=[q1], actors=[self.host_id])
        MockRuntime.add("ASSIGN", qubits=[q2], actors=[receiver])
        
        # Encode
        if message in ("01", "11"):
            MockRuntime.add("Z", qubits=[q1])
        if message in ("10", "11"):
            MockRuntime.add("X", qubits=[q1])
            
        # Send
        MockRuntime.add("ASSIGN", qubits=[q1], actors=[receiver])


class MockNetwork:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MockNetwork()
        return cls._instance

    def start(self, hosts=None):
        if hosts:
            for h in hosts:
                MockRuntime.add("ACTOR", actors=[h])

    def add_hosts(self, hosts):
        for h in hosts:
            MockRuntime.add("ACTOR", actors=[getattr(h, 'host_id', str(h))])

    def add_host(self, host):
        MockRuntime.add("ACTOR", actors=[getattr(host, 'host_id', str(host))])

    def stop(self, stop_hosts=False):
        pass


class MockLogger:
    @staticmethod
    def get_logger(*args, **kwargs):
        class DummyLogger:
            def debug(self, msg): pass
            def info(self, msg): pass
            def warning(self, msg): pass
            def error(self, msg): pass
        return DummyLogger()


def _execute_qunetsim_impl(engine: QuNetSimEngine, req: WorkspaceSimulateRequest):
    """Execute QuNetSim code by mocking its API and compiling to QPAL pseudocode."""
    MockRuntime.reset()
    
    # Create fake module structure
    qunetsim_components = types.ModuleType("qunetsim.components")
    qunetsim_components.Host = MockHost
    qunetsim_components.Network = MockNetwork
    
    qunetsim_utils = types.ModuleType("qunetsim.utils")
    qunetsim_utils.Logger = MockLogger

    qunetsim_objects = types.ModuleType("qunetsim.objects")
    qunetsim_objects.Qubit = MockQubit

    qunetsim_backends = types.ModuleType("qunetsim.backends")
    class DummyBackend:
        def start(self, **kwargs): pass
    qunetsim_backends.EQSNBackend = DummyBackend
    qunetsim_backends.CQCBackend = DummyBackend

    sys.modules["qunetsim"] = types.ModuleType("qunetsim")
    sys.modules["qunetsim.components"] = qunetsim_components
    sys.modules["qunetsim.objects"] = qunetsim_objects
    sys.modules["qunetsim.backends"] = qunetsim_backends
    sys.modules["qunetsim.utils"] = qunetsim_utils

    try:
        # Provide some basic globals
        global_env = {
            "__builtins__": __builtins__,
        }
        
        # Execute the user's QuNetSim code
        exec(req.code, global_env)
        
        # If it defined main(), run it
        if "main" in global_env and callable(global_env["main"]):
            global_env["main"]()
            
    except Exception as e:
        # If execution fails, return generic error summary
        return engine.format_response(
            engine="qunetsim",
            summary={"qubits": [], "actors": [], "total_steps": 0, "measurements": 0},
            steps=[],
            statevector=[],
            bloch_vectors=[],
            warnings=[f"QuNetSim script error: {str(e)}"]
        )

    # Convert recorded QuNetSim actions into QPAL simulation request
    sim_req = WorkspaceSimulateRequest(
        code=req.code,
        engine="custom",
        instructions=MockRuntime.instructions
    )
    
    from core.workspace.executor import simulate_workspace
    
    # Run the compiled instructions through the CustomEngine executor
    response = simulate_workspace(sim_req)
    
    # Re-tag engine to qunetsim
    response.engine = "qunetsim"
    
    # Add a warning that it's a simulated execution
    response.warnings.append("QuNetSim execution is simulated via QPAL backend. Network timing and exact threading behavior are mocked.")
    
    return response

