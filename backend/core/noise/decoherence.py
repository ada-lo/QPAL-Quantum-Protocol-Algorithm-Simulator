import numpy as np

def fidelity_decay(model_id: str, params: dict, depth: int) -> float:
    """Analytical fidelity decay for quick client-side preview"""
    if model_id == "depolarizing":
        p = params.get("p", 0.01)
        return float((1 - (4/3) * p) ** depth)
    elif model_id == "amplitude_damping":
        gamma = params.get("gamma", 0.05)
        return float((1 - gamma) ** depth)
    elif model_id == "phase_flip":
        p = params.get("p", 0.02)
        return float((1 - 2*p) ** depth)
    elif model_id == "thermal":
        t1 = params.get("t1", 100) * 1e3
        tgate = params.get("tgate", 50)
        return float(np.exp(-tgate / t1) ** depth)
    return 1.0
