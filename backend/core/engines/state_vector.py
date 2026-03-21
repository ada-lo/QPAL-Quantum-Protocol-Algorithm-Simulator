import numpy as np
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel
from api.schemas.request import SimulateRequest, NoiseSimRequest
from api.schemas.response import SimulateResponse, ComplexNum, BlochVector
from core.noise.noise_models import build_noise_model
import asyncio

GATE_MAP = {
    "H": "h", "X": "x", "Y": "y", "Z": "z",
    "S": "s", "T": "t", "CNOT": "cx", "SWAP": "swap", "CZ": "cz",
}

def build_qiskit_circuit(n_qubits: int, gates: list) -> QuantumCircuit:
    qc = QuantumCircuit(n_qubits)
    sorted_gates = sorted(gates, key=lambda g: g.step)
    for gate in sorted_gates:
        gid = gate.gate_id.upper()
        if gid == "MEASURE":
            continue
        q_name = GATE_MAP.get(gid)
        if not q_name:
            continue
        if gid == "CNOT" and gate.target_qubit is not None:
            getattr(qc, q_name)(gate.qubit, gate.target_qubit)
        elif gid == "SWAP" and gate.target_qubit is not None:
            qc.swap(gate.qubit, gate.target_qubit)
        else:
            getattr(qc, q_name)(gate.qubit)
    return qc

class StateVectorEngine:
    def __init__(self):
        self.backend = AerSimulator(method="statevector")

    async def run(self, req: SimulateRequest) -> SimulateResponse:
        return await asyncio.to_thread(self._run_sync, req)

    def _run_sync(self, req: SimulateRequest) -> SimulateResponse:
        qc = build_qiskit_circuit(req.n_qubits, req.gates)
        qc.save_statevector()

        noise_model = None
        if req.noise_model != "ideal":
            noise_model = build_noise_model(req.noise_model, req.noise_params)

        from qiskit import transpile
        job = self.backend.run(
            transpile(qc, self.backend),
            noise_model=noise_model,
            shots=req.shots,
        )
        result = job.result()
        sv = np.asarray(result.get_statevector())

        probs = [float(abs(a)**2) for a in sv]
        state_vector = [ComplexNum(re=float(a.real), im=float(a.imag)) for a in sv]

        # Compute fidelity vs ideal (only meaningful when noise present)
        fidelity = 1.0
        if noise_model:
            ideal_job = AerSimulator(method="statevector").run(transpile(qc, AerSimulator(method="statevector")))
            ideal_sv = np.asarray(ideal_job.result().get_statevector())
            fidelity = float(abs(np.dot(np.conj(ideal_sv), sv))**2)

        # Single-qubit Bloch vectors
        bloch_vecs = []
        for q in range(req.n_qubits):
            # Partial trace
            dm = np.outer(sv, np.conj(sv))
            keep = [q]
            n = req.n_qubits
            other = [i for i in range(n) if i not in keep]
            # Reshape and trace
            dm_r = dm.reshape([2]*n*2)
            for idx, o in enumerate(sorted(other)):
                dm_r = np.trace(dm_r, axis1=o-idx, axis2=n-idx+o-idx*2)
            dm_q = dm_r.reshape(2, 2) if req.n_qubits > 1 else dm_r
            bloch_vecs.append(BlochVector(
                x=float(2 * dm_q[0,1].real),
                y=float(2 * dm_q[0,1].imag),
                z=float(dm_q[0,0].real - dm_q[1,1].real),
            ))

        return SimulateResponse(
            state_vector=state_vector,
            probabilities=probs,
            fidelity=fidelity,
            n_qubits=req.n_qubits,
            shots=req.shots,
            bloch_vectors=bloch_vecs,
            engine_used="gpu-statevector" if req.n_qubits <= 20 else "statevector",
        )

    async def run_with_noise(self, req: NoiseSimRequest, noise_model) -> dict:
        return await asyncio.to_thread(self._run_sync, req)

    async def run_streaming(self, req: SimulateRequest):
        sorted_gates = sorted(req.gates, key=lambda g: g.step)
        for i, gate in enumerate(sorted_gates):
            partial_req = SimulateRequest(
                n_qubits=req.n_qubits,
                gates=sorted_gates[:i+1],
                noise_model=req.noise_model,
                noise_params=req.noise_params,
                shots=256,
            )
            result = await self.run(partial_req)
            yield {"step": i, "gate": gate.gate_id, **result.model_dump()}
