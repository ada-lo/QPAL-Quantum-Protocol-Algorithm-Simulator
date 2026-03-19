def validate_n_qubits(n: int) -> None:
    if n < 1 or n > 30:
        raise ValueError(f"n_qubits must be 1–30, got {n}")

def validate_gate(gate_id: str) -> None:
    VALID = {"H","X","Y","Z","S","T","CNOT","SWAP","CZ","TOFFOLI","MEASURE"}
    if gate_id.upper() not in VALID:
        raise ValueError(f"Unknown gate: {gate_id}")
