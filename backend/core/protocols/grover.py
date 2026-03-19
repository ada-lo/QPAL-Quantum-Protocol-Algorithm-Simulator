from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np

def run_grover(n_qubits: int = 3, target: int = 5) -> dict:
    """Grover search: find |target⟩ in 2^n_qubits states"""
    N = 2 ** n_qubits
    optimal_iters = max(1, int(np.pi / 4 * np.sqrt(N)))

    qc = QuantumCircuit(n_qubits)
    # Initialize superposition
    qc.h(range(n_qubits))

    for _ in range(optimal_iters):
        # Oracle: flip phase of target
        _apply_oracle(qc, n_qubits, target)
        # Diffusion operator
        qc.h(range(n_qubits))
        qc.x(range(n_qubits))
        qc.h(n_qubits - 1)
        qc.mcx(list(range(n_qubits - 1)), n_qubits - 1)
        qc.h(n_qubits - 1)
        qc.x(range(n_qubits))
        qc.h(range(n_qubits))

    qc.measure_all()
    backend = AerSimulator()
    job = backend.run(transpile(qc, backend), shots=1024)
    result = job.result()
    counts = result.get_counts()

    top = max(counts, key=counts.get)
    success_prob = counts.get(top, 0) / 1024

    return {
        "target": target,
        "n_qubits": n_qubits,
        "iterations": optimal_iters,
        "counts": counts,
        "top_result": int(top, 2),
        "success_probability": success_prob,
    }

def _apply_oracle(qc: QuantumCircuit, n: int, target: int):
    bits = [int(b) for b in bin(target)[2:].zfill(n)]
    for i, b in enumerate(bits):
        if b == 0:
            qc.x(i)
    qc.h(n - 1)
    qc.mcx(list(range(n - 1)), n - 1)
    qc.h(n - 1)
    for i, b in enumerate(bits):
        if b == 0:
            qc.x(i)
