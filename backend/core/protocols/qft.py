"""Quantum Fourier Transform — Qiskit implementation"""

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np


def run_qft(n_qubits: int = 3, input_state: int = 1) -> dict:
    """Run QFT on |input_state⟩ and return output amplitudes + phases"""
    N = 2 ** n_qubits

    qc = QuantumCircuit(n_qubits)

    # Prepare input basis state
    for i in range(n_qubits):
        if (input_state >> i) & 1:
            qc.x(i)

    # Apply QFT
    _apply_qft(qc, n_qubits)

    # Use statevector simulator to get amplitudes
    backend = AerSimulator(method="statevector")
    qc_sv = qc.copy()
    qc_sv.save_statevector()
    job = backend.run(transpile(qc_sv, backend))
    result = job.result()
    sv = result.get_statevector()
    amplitudes = np.array(sv)

    magnitudes = np.abs(amplitudes).tolist()
    phases = np.angle(amplitudes).tolist()

    # Also run with measurements for counts
    qc_meas = qc.copy()
    qc_meas.measure_all()
    meas_backend = AerSimulator()
    job2 = meas_backend.run(transpile(qc_meas, meas_backend), shots=1024)
    counts = job2.result().get_counts()

    return {
        "n_qubits": n_qubits,
        "input_state": input_state,
        "magnitudes": magnitudes,
        "phases": phases,
        "counts": counts,
        "gate_count": qc.size(),
        "classical_fft_ops": int(N * np.log2(N)) if N > 1 else 1,
        "quantum_gates": n_qubits * (n_qubits + 1) // 2,
    }


def _apply_qft(qc: QuantumCircuit, n: int):
    """Apply QFT to first n qubits"""
    for i in range(n):
        qc.h(i)
        for j in range(i + 1, n):
            angle = np.pi / (2 ** (j - i))
            qc.cp(angle, j, i)

    # Swap qubits for correct ordering
    for i in range(n // 2):
        qc.swap(i, n - 1 - i)
