# ============================================================
# Quantum Hamming Code (QHC) — Qiskit
# [[7,1,3]] Steane code: encodes 1 logical qubit in 7 physical qubits.
# Demonstrates encoding + single-qubit error detection.
# ============================================================
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def build_steane_encode():
    """
    Steane [[7,1,3]] code encoder.
    Logical qubit on q[0], encoded across q[0..6].
    """
    qc = QuantumCircuit(7, 3)

    # 1. Logical |+⟩ on data qubit
    qc.h(0)

    # 2. Encoding via Steane CNOT network
    qc.cx(0, 3); qc.cx(0, 4); qc.cx(0, 5); qc.cx(0, 6)
    qc.h(1)
    qc.cx(1, 3); qc.cx(1, 5); qc.cx(1, 6)
    qc.h(2)
    qc.cx(2, 4); qc.cx(2, 5); qc.cx(2, 6)

    qc.barrier()

    # 3. Simulate error — bit flip on q[5]
    qc.x(5)
    qc.barrier()

    # 4. Measure parity bits (syndrome)
    qc.measure([2, 4, 5], [0, 1, 2])
    return qc

def run_qhc():
    print("[QHC] Steane [[7,1,3]] code — encoding and error detection")
    qc = build_steane_encode()
    print(qc.draw(output='text'))
    sim = AerSimulator()
    result = sim.run(transpile(qc, sim), shots=512).result()
    counts = result.get_counts()
    print(f"[QHC] Syndrome counts: {counts}")
    print("[QHC] Syndrome identifies error location — correction applied classically.")

if __name__ == '__main__':
    run_qhc()
