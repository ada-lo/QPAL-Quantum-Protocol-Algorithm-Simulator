# ============================================================
# Quantum Neural Network (QNN) — Qiskit Machine Learning
# 2-qubit parameterized QNN trained on two-moons classification.
# Uses SamplerQNN + parameter-shift rule via COBYLA optimizer.
# ============================================================
import numpy as np
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector
from qiskit_machine_learning.neural_networks import SamplerQNN
from qiskit_machine_learning.algorithms import NeuralNetworkClassifier
from qiskit_machine_learning.optimizers import COBYLA
from qiskit_aer.primitives import Sampler
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score

# 1. Dataset
X, y = make_moons(n_samples=40, noise=0.1, random_state=42)
y = np.where(y==0, -1, 1)
X = MinMaxScaler(feature_range=(0, np.pi)).fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# 2. Parameterized QNN circuit
def build_qnn_circuit(n_qubits=2, n_layers=2):
    input_params  = ParameterVector('x', n_qubits)
    weight_params = ParameterVector('w', n_qubits * n_layers * 2)
    qc = QuantumCircuit(n_qubits)
    for i in range(n_qubits):
        qc.ry(input_params[i], i)       # Data encoding
    w = 0
    for _ in range(n_layers):
        for i in range(n_qubits-1):
            qc.cx(i, i+1)              # Entanglement
        for i in range(n_qubits):
            qc.ry(weight_params[w], i); w+=1
            qc.rz(weight_params[w], i); w+=1
    return qc, input_params, weight_params

qc, input_params, weight_params = build_qnn_circuit()
print("[QNN] Circuit:")
print(qc.draw(output='text'))

# 3. Parity interpretation function
def parity(x):
    return (-1) ** int(np.sum(x) % 2)

# 4. SamplerQNN
qnn = SamplerQNN(
    circuit=qc,
    input_params=input_params,
    weight_params=weight_params,
    interpret=parity,
    output_shape=2,
    sampler=Sampler()
)

# 5. Train
print("\n[QNN] Training (COBYLA, 150 iterations)...")
classifier = NeuralNetworkClassifier(
    neural_network=qnn,
    optimizer=COBYLA(maxiter=150),
    loss='cross_entropy'
)
classifier.fit(X_train, y_train)

# 6. Evaluate
y_pred = classifier.predict(X_test)
print(f"[QNN] Test Accuracy: {accuracy_score(y_test, y_pred)*100:.2f}%")
print(f"[QNN] Predictions:  {y_pred}")
print(f"[QNN] Ground Truth: {y_test}")
