# ============================================================
# Shor's Algorithm — Qiskit
# Factors N=15 using quantum period finding (r=4 for a=7).
# ============================================================
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from math import gcd
from fractions import Fraction

def build_shors_circuit(a=7, N=15, n_count=4):
    """Build QPE circuit for order-finding: finds r s.t. a^r ≡ 1 mod N"""
    qc = QuantumCircuit(n_count + 4, n_count)

    # 1. Initialize work register to |1⟩
    qc.x(n_count)

    # 2. Hadamard on counting register
    for q in range(n_count):
        qc.h(q)

    # 3. Controlled modular exponentiation (hardcoded for a=7, N=15)
    repetitions = 1
    for q in range(n_count):
        for _ in range(repetitions):
            qc.cswap(q, n_count, n_count + 1)
            qc.cswap(q, n_count + 1, n_count + 2)
            qc.cswap(q, n_count + 2, n_count + 3)
        repetitions *= 2

    # 4. Inverse QFT on counting register
    for j in range(n_count // 2):
        qc.swap(j, n_count - 1 - j)
    for j in range(n_count):
        qc.h(j)
        for k in range(j + 1, n_count):
            qc.cp(-3.14159 / (2 ** (k - j)), k, j)

    # 5. Measure counting register
    qc.measure(range(n_count), range(n_count))
    return qc

def run_shors(a=7, N=15):
    print(f"[Shor's] Factoring N={N} using a={a}")
    qc = build_shors_circuit(a, N)

    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    result = simulator.run(compiled, shots=1024).result()
    counts = result.get_counts()
    print(f"[Shor's] Measurement counts: {counts}")

    for bitstring in sorted(counts, key=counts.get, reverse=True):
        phase = int(bitstring, 2) / (2 ** 4)
        if phase == 0:
            continue
        frac = Fraction(phase).limit_denominator(N)
        r = frac.denominator
        print(f"  Phase={phase:.4f} → r={r}")
        if r % 2 == 0:
            f1 = gcd(a**(r//2) - 1, N)
            f2 = gcd(a**(r//2) + 1, N)
            if f1 not in (1, N) or f2 not in (1, N):
                print(f"[Shor's] Factors of {N}: {f1} and {f2}")
                return
    print("[Shor's] Could not determine factors — retry.")

if __name__ == '__main__':
    run_shors()
