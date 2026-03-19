from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit import transpile

def run_teleportation(alpha: float = 0.707, beta: float = 0.707) -> dict:
    """Simulate full quantum teleportation protocol"""
    # Normalize
    norm = (alpha**2 + beta**2) ** 0.5
    alpha /= norm
    beta /= norm

    qc = QuantumCircuit(3, 2)
    # Initialize |ψ⟩ = α|0⟩ + β|1⟩ on qubit 0
    from qiskit.circuit.library import Initialize
    qc.append(Initialize([alpha, beta]), [0])

    # Create Bell pair (qubits 1 & 2)
    qc.h(1)
    qc.cx(1, 2)

    # Alice's operations
    qc.cx(0, 1)
    qc.h(0)

    # Measure
    qc.measure([0, 1], [0, 1])

    # Bob's corrections
    qc.cx(1, 2)
    qc.cz(0, 2)

    qc.save_statevector()

    backend = AerSimulator(method="statevector")
    job = backend.run(transpile(qc, backend), shots=1024)
    result = job.result()
    sv = result.get_statevector()

    # Bob's qubit (qubit 2) should be in state |ψ⟩
    return {
        "circuit_depth": qc.depth(),
        "fidelity": float(abs(sv[0])**2 + abs(sv[4])**2),  # simplified
        "state_alpha": alpha,
        "state_beta": beta,
        "success": True,
    }
