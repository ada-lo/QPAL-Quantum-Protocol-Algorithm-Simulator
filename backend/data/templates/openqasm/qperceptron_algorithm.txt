# ============================================================
# Quantum Perceptron — Qiskit
# Parameterized 2-qubit perceptron trained on the AND gate.
# Uses parameter-shift rule for gradient computation.
# ============================================================
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

training_data = [([0,0],0),([0,1],0),([1,0],0),([1,1],1)]

def build_perceptron_circuit(x, weights):
    qc = QuantumCircuit(2)
    qc.ry(x[0]*np.pi, 0)     # Encode input
    qc.ry(x[1]*np.pi, 1)
    qc.rz(weights[0], 0)     # Trainable weights
    qc.rz(weights[1], 1)
    qc.cx(0, 1)              # Entanglement
    qc.ry(weights[2], 1)     # Output activation
    return qc

def predict(x, weights):
    sv = Statevector(build_perceptron_circuit(x, weights))
    return sv.probabilities([1])[1]

def bce(y_true, y_pred):
    y_pred = np.clip(y_pred, 1e-9, 1-1e-9)
    return -y_true*np.log(y_pred) - (1-y_true)*np.log(1-y_pred)

np.random.seed(7)
weights = np.random.uniform(0, np.pi, 3)
lr, epochs = 0.3, 40

print("[QPerceptron] Training on AND gate...")
for epoch in range(epochs):
    total_loss, grad = 0, np.zeros(3)
    for x, y in training_data:
        for i in range(len(weights)):
            wp = weights.copy(); wp[i] += np.pi/2
            wm = weights.copy(); wm[i] -= np.pi/2
            grad[i] += (predict(x, wp) - predict(x, wm)) / 2
        total_loss += bce(y, predict(x, weights))
    weights -= lr * grad / len(training_data)
    if (epoch+1) % 10 == 0:
        print(f"  Epoch {epoch+1:3d} | Loss: {total_loss/len(training_data):.4f}")

print("\n[QPerceptron] Final predictions:")
for x, y in training_data:
    p = predict(x, weights)
    print(f"  Input {x} → P(1)={p:.3f} → Pred={1 if p>0.5 else 0} | True={y}")
