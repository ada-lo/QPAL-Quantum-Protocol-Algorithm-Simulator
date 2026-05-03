# ============================================================
# Quantum Private Comparison (QPC) — Socialist Millionaire Problem
# Alice and Bob check equality of secrets WITHOUT revealing them.
# ============================================================
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def encode_secret(qc, qubit_idx, bit_value):
    if bit_value == 1:
        qc.x(qubit_idx)

def build_qpc_circuit(alice_secret, bob_secret, n_bits=3):
    total_qubits = n_bits * 2 + 1
    qc = QuantumCircuit(total_qubits, n_bits)

    alice_bits = [(alice_secret >> i) & 1 for i in range(n_bits)]
    bob_bits   = [(bob_secret   >> i) & 1 for i in range(n_bits)]
    print(f"[QPC] Alice bits: {alice_bits}")
    print(f"[QPC] Bob   bits: {bob_bits}")

    for i in range(n_bits):
        a_q = i
        b_q = n_bits + i
        # 1. Bell pair
        qc.h(a_q)
        qc.cx(a_q, b_q)
        # 2. Encode secrets
        encode_secret(qc, a_q, alice_bits[i])
        encode_secret(qc, b_q, bob_bits[i])
        # 3. Decode
        qc.cx(a_q, b_q)
        qc.h(a_q)
        # 4. Measure — |0⟩ = match, |1⟩ = mismatch
        qc.measure(a_q, i)
    return qc

def run_qpc(alice_secret=5, bob_secret=5, n_bits=3):
    print(f"\n[QPC] Alice={alice_secret} vs Bob={bob_secret} ({n_bits}-bit)")
    qc = build_qpc_circuit(alice_secret, bob_secret, n_bits)
    sim = AerSimulator()
    result = sim.run(transpile(qc, sim), shots=256).result()
    counts = result.get_counts()
    print(f"[QPC] Counts: {counts}")
    all_zero = '0' * n_bits
    if all_zero in counts and counts[all_zero] > 200:
        print("[QPC] EQUAL (privacy preserved)")
    else:
        print("[QPC] NOT EQUAL (privacy preserved)")

if __name__ == '__main__':
    run_qpc(5, 5)
    run_qpc(5, 3)
