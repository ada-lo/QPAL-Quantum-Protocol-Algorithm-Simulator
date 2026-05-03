# ============================================================
# Quantum K-Means Clustering (QKMeans) — Qiskit
# Swap-test-based quantum distance for clustering.
# ============================================================
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from sklearn.datasets import make_blobs
from sklearn.preprocessing import normalize

X, _ = make_blobs(n_samples=12, centers=2, n_features=2, random_state=42)
X = normalize(X)

def swap_test_circuit(state_a, state_b):
    qc = QuantumCircuit(3, 1)
    theta_a = 2 * np.arccos(np.clip(state_a[0], -1, 1))
    theta_b = 2 * np.arccos(np.clip(state_b[0], -1, 1))
    qc.ry(theta_a, 1)
    qc.ry(theta_b, 2)
    qc.h(0)
    qc.cswap(0, 1, 2)
    qc.h(0)
    qc.measure(0, 0)
    return qc

def quantum_distance(a, b, shots=512):
    qc = swap_test_circuit(a, b)
    sim = AerSimulator()
    result = sim.run(transpile(qc, sim), shots=shots).result()
    counts = result.get_counts()
    return counts.get('1', 0) / shots  # p(1) ∝ distance

def qkmeans(X, k=2, max_iter=5):
    np.random.seed(0)
    centroids = X[np.random.choice(len(X), k, replace=False)]
    print(f"[QKMeans] Initial centroids:\n{centroids}\n")

    for iteration in range(max_iter):
        labels = [np.argmin([quantum_distance(p, c) for c in centroids]) for p in X]
        new_centroids = np.array([X[np.array(labels)==j].mean(axis=0) for j in range(k)])
        print(f"[QKMeans] Iter {iteration+1} labels: {labels}")
        if np.allclose(centroids, new_centroids, atol=1e-4):
            print("[QKMeans] Converged.")
            break
        centroids = new_centroids

    print(f"\n[QKMeans] Final labels: {labels}")
    return labels, centroids

labels, centroids = qkmeans(X)
print(f"[QKMeans] Final centroids:\n{centroids}")
