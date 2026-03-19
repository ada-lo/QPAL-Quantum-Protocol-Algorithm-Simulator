from core.protocols.bb84 import run_bb84
from core.protocols.superdense import run_superdense
from core.protocols.grover import run_grover

def test_bb84_key_generation():
    result = run_bb84(n_bits=100, eve_present=False)
    assert result["key_length"] > 30  # ~50% should match
    assert result["qber"] < 0.01      # No eve → near-zero error

def test_bb84_eve_detection():
    result = run_bb84(n_bits=200, eve_present=True)
    assert result["qber"] > 0.15  # Eve introduces ~25% QBER

def test_grover_3qubit():
    result = run_grover(n_qubits=3, target=5)
    assert result["top_result"] == 5
    assert result["success_probability"] > 0.7
