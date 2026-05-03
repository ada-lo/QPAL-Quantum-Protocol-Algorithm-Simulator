# ============================================================
# Quantum Support Vector Machine (QSVM) — Qiskit
# Binary classification using ZZFeatureMap quantum kernel.
# ============================================================
import numpy as np
from qiskit.circuit.library import ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_machine_learning.algorithms import QSVC
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score

# 1. Generate binary classification dataset
X, y = make_classification(n_samples=40, n_features=2, n_informative=2,
                            n_redundant=0, random_state=42)
y = np.where(y == 0, -1, 1)

# 2. Normalize features to [0, 2π]
scaler = MinMaxScaler(feature_range=(0, np.pi * 2))
X = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# 3. Quantum feature map (ZZFeatureMap — 2 qubits, 2 reps)
feature_map = ZZFeatureMap(feature_dimension=2, reps=2, entanglement='linear')
print("[QSVM] Feature map circuit:")
print(feature_map.decompose())

# 4. Quantum kernel — fidelity-based inner product
quantum_kernel = FidelityQuantumKernel(feature_map=feature_map)

# 5. Train QSVM
print("\n[QSVM] Training...")
qsvc = QSVC(quantum_kernel=quantum_kernel)
qsvc.fit(X_train, y_train)

# 6. Evaluate
y_pred = qsvc.predict(X_test)
print(f"[QSVM] Accuracy: {accuracy_score(y_test, y_pred)*100:.2f}%")
print(f"[QSVM] Predictions:  {y_pred}")
print(f"[QSVM] Ground Truth: {y_test}")
