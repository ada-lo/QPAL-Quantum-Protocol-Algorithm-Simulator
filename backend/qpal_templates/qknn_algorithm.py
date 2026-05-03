# ============================================================
# Quantum K-Nearest Neighbors (QKNN) — Qiskit
# Classifies a test point via quantum swap-test distance oracle.
# ============================================================
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from collections import Counter

training_data = [
    (np.array([1.0, 0.0]), 'A'),
    (np.array([0.9, 0.1]), 'A'),
    (np.array([0.0, 1.0]), 'B'),
    (np.array([0.1, 0.9]), 'B'),
    (np.array([0.8, 0.2]), 'A'),
    (np.array([0.2, 0.8]), 'B'),
]
test_point = np.array([0.85, 0.15])

def swap_test(state_a, state_b, shots=1024):
    qc = QuantumCircuit(3, 1)
    theta_a = 2 * np.arccos(np.clip(state_a[0], -1, 1))
    theta_b = 2 * np.arccos(np.clip(state_b[0], -1, 1))
    qc.ry(theta_a, 1)
    qc.ry(theta_b, 2)
    qc.h(0)
    qc.cswap(0, 1, 2)
    qc.h(0)
    qc.measure(0, 0)
    sim = AerSimulator()
    result = sim.run(transpile(qc, sim), shots=shots).result()
    return result.get_counts().get('1', 0) / shots

print(f"[QKNN] Test point: {test_point}")
distances = []
for (vec, label) in training_data:
    d = swap_test(test_point, vec)
    distances.append((d, label))
    print(f"  Class={label}, dist={d:.4f}")

K = 3
distances.sort(key=lambda x: x[0])
votes = Counter(label for _, label in distances[:K])
predicted = votes.most_common(1)[0][0]
print(f"\n[QKNN] {K}-NN prediction: '{predicted}'")
