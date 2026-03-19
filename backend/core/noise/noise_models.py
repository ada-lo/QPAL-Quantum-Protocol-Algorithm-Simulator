from qiskit_aer.noise import NoiseModel, depolarizing_error, amplitude_damping_error, phase_damping_error, thermal_relaxation_error
from qiskit_aer.noise import ReadoutError
import numpy as np

def build_noise_model(model_id: str, params: dict) -> NoiseModel | None:
    if model_id == "ideal":
        return None

    nm = NoiseModel()

    if model_id == "depolarizing":
        p = float(params.get("p", 0.01))
        error1 = depolarizing_error(p, 1)
        error2 = depolarizing_error(p * 2, 2)
        nm.add_all_qubit_quantum_error(error1, ["h", "x", "y", "z", "s", "t"])
        nm.add_all_qubit_quantum_error(error2, ["cx", "cz", "swap"])

    elif model_id == "amplitude_damping":
        gamma = float(params.get("gamma", 0.05))
        error = amplitude_damping_error(gamma)
        nm.add_all_qubit_quantum_error(error, ["h", "x", "y", "z", "s", "t"])

    elif model_id == "phase_flip":
        p = float(params.get("p", 0.02))
        error = phase_damping_error(p)
        nm.add_all_qubit_quantum_error(error, ["h", "x", "y", "z", "s", "t"])

    elif model_id == "thermal":
        t1 = float(params.get("t1", 100)) * 1e3   # μs → ns
        t2 = float(params.get("t2", 80)) * 1e3
        tgate = float(params.get("tgate", 50))     # ns
        t2 = min(t2, 2 * t1)  # T2 ≤ 2T1 physical constraint
        error = thermal_relaxation_error(t1, t2, tgate)
        nm.add_all_qubit_quantum_error(error, ["h", "x", "y", "z", "s", "t"])

    return nm
