from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

BELL_STATES = {
    (0, 0): "Φ+", (0, 1): "Ψ+", (1, 0): "Φ-", (1, 1): "Ψ-"
}

def run_superdense(bit1: int = 0, bit2: int = 0) -> dict:
    qc = QuantumCircuit(2, 2)
    # Create Bell pair
    qc.h(0); qc.cx(0, 1)
    # Alice encodes
    if bit2: qc.x(0)
    if bit1: qc.z(0)
    # Bob decodes
    qc.cx(0, 1); qc.h(0)
    qc.measure([0, 1], [0, 1])

    backend = AerSimulator()
    job = backend.run(transpile(qc, backend), shots=1024)
    result = job.result()
    counts = result.get_counts()

    return {
        "sent_bits": [bit1, bit2],
        "bell_state": BELL_STATES[(bit1, bit2)],
        "measurement_counts": counts,
        "decoded": max(counts, key=counts.get),
    }
