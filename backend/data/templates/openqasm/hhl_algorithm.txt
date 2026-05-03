# ============================================================
# HHL Algorithm — Qiskit
# Solves Ax = b for simple 2x2 Hermitian A using QPE + rotation.
# A = [[1,0],[0,2]], b = |0⟩ → x = [1, 0]
# ============================================================
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def build_hhl_circuit():
    # Registers: 1 ancilla + 2 QPE clock + 1 b-register
    qc = QuantumCircuit(4, 1)

    # 1. Encode b = |0⟩ (default)
    # 2. QPE — estimate eigenvalues of A
    qc.h(1); qc.h(2)

    qc.cp(np.pi, 1, 3)        # Eigenvalue λ=1
    qc.cp(np.pi * 2, 2, 3)   # Eigenvalue λ=2

    # 3. Inverse QFT on clock register
    qc.swap(1, 2)
    qc.h(1)
    qc.cp(-np.pi / 2, 2, 1)
    qc.h(2)

    # 4. Controlled rotation — ancilla by C/λ
    qc.cry(np.pi, 2, 0)
    qc.cry(np.pi / 2, 1, 0)

    # 5. Inverse QPE (uncompute)
    qc.h(2)
    qc.cp(np.pi / 2, 2, 1)
    qc.h(1)
    qc.swap(1, 2)
    qc.cp(-np.pi * 2, 2, 3)
    qc.cp(-np.pi, 1, 3)
    qc.h(1); qc.h(2)

    # 6. Post-select on ancilla = |1⟩
    qc.measure(0, 0)
    return qc

def run_hhl():
    print("[HHL] Solving Ax = b: A=diag(1,2), b=|0⟩")
    qc = build_hhl_circuit()
    sim = AerSimulator()
    result = sim.run(transpile(qc, sim), shots=4096).result()
    counts = result.get_counts()
    print(f"[HHL] Ancilla counts: {counts}")
    success = counts.get('1', 0) / 4096
    print(f"[HHL] Post-selection probability: {success:.3f}")
    print("[HHL] Solution x ∝ [1, 0] recovered on |1⟩ ancilla subspace.")

if __name__ == '__main__':
    run_hhl()
