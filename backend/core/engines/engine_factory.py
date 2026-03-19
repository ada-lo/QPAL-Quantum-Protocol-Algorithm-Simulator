from core.engines.state_vector import StateVectorEngine
from core.engines.qdd_engine_wrapper import QDDEngineWrapper
import os

QDD_THRESHOLD = int(os.getenv("MAX_QUBITS_STATEVECTOR", 20))

def get_engine(n_qubits: int):
    """Route to QDD engine for large circuits, state vector for small"""
    if n_qubits > 6:
        try:
            return QDDEngineWrapper()
        except ImportError:
            pass  # Fall back to state vector if mqt.ddsim not available
    return StateVectorEngine()
