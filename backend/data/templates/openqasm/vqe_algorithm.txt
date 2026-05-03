# ============================================================
# Variational Quantum Eigensolver (VQE) — Qiskit
# Finds ground state energy of H2 molecule (simplified 2-qubit Hamiltonian).
# ============================================================
import numpy as np
from qiskit.quantum_info import SparsePauliOp, Statevector
from qiskit import QuantumCircuit
from scipy.optimize import minimize

# 1. Define H2 Hamiltonian (simplified 2-qubit Pauli sum)
hamiltonian = SparsePauliOp.from_list([
    ("ZZ", -1.0523732),
    ("ZI",  0.3979374),
    ("IZ", -0.3979374),
    ("XX", -0.0112801),
    ("YY",  0.1809312),
])

# 2. Ansatz — Hardware-efficient RY-CNOT ansatz (4 parameters)
def build_ansatz(params):
    qc = QuantumCircuit(2)
    qc.ry(params[0], 0)
    qc.ry(params[1], 1)
    qc.cx(0, 1)
    qc.ry(params[2], 0)
    qc.ry(params[3], 1)
    return qc

# 3. Energy expectation value via statevector
def compute_energy(params):
    qc = build_ansatz(params)
    sv = Statevector(qc)
    return sv.expectation_value(hamiltonian).real

# 4. Classical optimization loop (COBYLA)
np.random.seed(42)
initial_params = np.random.uniform(0, 2 * np.pi, 4)
print(f"[VQE] Initial energy: {compute_energy(initial_params):.6f} Hartree")

result = minimize(compute_energy, initial_params, method='COBYLA',
                  options={'maxiter': 500, 'rhobeg': 0.5})

# 5. Results
print(f"[VQE] Optimized energy: {result.fun:.6f} Hartree")
print(f"[VQE] Exact H2 ground state ≈ -1.857 Hartree (FCI)")
print(f"[VQE] Optimal parameters: {np.round(result.x, 4)}")
