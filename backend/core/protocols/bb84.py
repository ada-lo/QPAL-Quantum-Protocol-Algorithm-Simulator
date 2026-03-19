import random
from typing import Literal

Basis = Literal["+", "x"]
Bit = Literal[0, 1]

def encode(bit: int, basis: Basis) -> str:
    return f"{basis}{bit}"

def measure(state: str, basis: Basis) -> int:
    src_basis = state[0]
    src_bit = int(state[1])
    if src_basis == basis:
        return src_bit
    return random.randint(0, 1)  # Random result for wrong basis

def run_bb84(n_bits: int = 20, eve_present: bool = False) -> dict:
    alice_bits   = [random.randint(0, 1) for _ in range(n_bits)]
    alice_bases  = [random.choice(["+", "x"]) for _ in range(n_bits)]
    bob_bases    = [random.choice(["+", "x"]) for _ in range(n_bits)]
    eve_bases    = [random.choice(["+", "x"]) for _ in range(n_bits)] if eve_present else []

    transmitted = []
    for i in range(n_bits):
        state = encode(alice_bits[i], alice_bases[i])
        if eve_present:
            eve_result = measure(state, eve_bases[i])
            state = encode(eve_result, eve_bases[i])
        bob_result = measure(state, bob_bases[i])
        transmitted.append({
            "alice_bit": alice_bits[i],
            "alice_basis": alice_bases[i],
            "bob_basis": bob_bases[i],
            "bob_result": bob_result,
            "match": alice_bases[i] == bob_bases[i],
            "eve_basis": eve_bases[i] if eve_present else None,
            "disturbed": eve_present and eve_bases[i] != alice_bases[i],
        })

    key_bits = [t["alice_bit"] for t in transmitted if t["match"]]
    errors = sum(1 for t in transmitted if t["match"] and t["bob_result"] != t["alice_bit"])
    qber = errors / max(len(key_bits), 1)

    return {
        "bits": transmitted,
        "key": key_bits,
        "key_length": len(key_bits),
        "qber": qber,
        "eve_detected": qber > 0.1 if eve_present else False,
    }
