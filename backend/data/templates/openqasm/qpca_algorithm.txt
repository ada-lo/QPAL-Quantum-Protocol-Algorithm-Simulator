# ============================================================
# Quantum PCA (QPCA) — Qiskit
# Extracts principal components via quantum amplitude encoding + QPE.
# ============================================================
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# 1. Classical dataset
data = np.array([[2.0,1.0],[2.5,1.5],[3.0,2.0],[1.5,0.5]])
data_centered = data - data.mean(axis=0)
cov = np.cov(data_centered.T)
print(f"[QPCA] Covariance matrix:\n{cov}")

# 2. Classical eigendecomposition (simulates QPE output)
eigenvalues, eigenvectors = np.linalg.eigh(cov)
idx = np.argsort(eigenvalues)[::-1]
eigenvalues, eigenvectors = eigenvalues[idx], eigenvectors[:, idx]
print(f"[QPCA] Eigenvalues: {eigenvalues}")
print(f"[QPCA] Eigenvectors:\n{eigenvectors}")

# 3. Quantum encoding of top principal component
def encode_principal_component(eigvec):
    eigvec = eigvec / np.linalg.norm(eigvec)
    theta = 2 * np.arccos(np.clip(eigvec[0], -1, 1))
    qc = QuantumCircuit(2, 2)
    qc.ry(theta, 0)     # Encode top eigenvector
    qc.h(1)
    qc.cx(1, 0)
    qc.h(1)
    qc.measure([0, 1], [0, 1])
    return qc

print("\n[QPCA] Encoding top principal component...")
qc = encode_principal_component(eigenvectors[:, 0])
sim = AerSimulator()
result = sim.run(transpile(qc, sim), shots=1024).result()
print(f"[QPCA] Measurement: {result.get_counts()}")
print(f"[QPCA] Top PC: {eigenvectors[:,0]}")
print(f"[QPCA] Explained variance: {eigenvalues[0]/eigenvalues.sum()*100:.1f}%")
