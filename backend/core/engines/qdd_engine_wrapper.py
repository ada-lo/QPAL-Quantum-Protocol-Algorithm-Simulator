"""
Wrapper around mqt.ddsim for scalable simulation beyond 6 qubits.
Falls back to state vector if mqt.ddsim is unavailable.
"""
import asyncio
from api.schemas.request import SimulateRequest
from api.schemas.response import SimulateResponse, ComplexNum, QDDGraphModel, QDDNodeModel, QDDEdge

class QDDEngineWrapper:
    async def run(self, req: SimulateRequest) -> SimulateResponse:
        return await asyncio.to_thread(self._run_sync, req)

    def _run_sync(self, req: SimulateRequest) -> SimulateResponse:
        try:
            from mqt import ddsim
            from qiskit import QuantumCircuit, transpile
            from core.engines.state_vector import build_qiskit_circuit
            from core.qdd.qdd_serializer import serialize_qdd

            qc = build_qiskit_circuit(req.n_qubits, req.gates)
            qc.measure_all()

            provider = ddsim.DDSIMProvider()
            backend = provider.get_backend("statevector_simulator")
            job = backend.run(transpile(qc, backend), shots=req.shots)
            result = job.result()

            sv = result.get_statevector()
            probs = [float(abs(a)**2) for a in sv]
            state_vector = [ComplexNum(re=float(a.real), im=float(a.imag)) for a in sv]

            # Get QDD graph structure for visualization
            qdd_graph = serialize_qdd(result, req.n_qubits)

            return SimulateResponse(
                state_vector=state_vector,
                probabilities=probs,
                fidelity=1.0,
                n_qubits=req.n_qubits,
                shots=req.shots,
                qdd_graph=qdd_graph,
                engine_used="qdd",
            )
        except Exception as e:
            # Fallback to state vector
            from core.engines.state_vector import StateVectorEngine
            import asyncio
            return asyncio.get_event_loop().run_until_complete(StateVectorEngine().run(req))

    async def run_streaming(self, req: SimulateRequest):
        result = await self.run(req)
        yield result.model_dump()
