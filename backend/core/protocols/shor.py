"""Shor's factoring algorithm — small N demonstration"""

def run_shor(N: int = 15) -> dict:
    """Simplified Shor demo for small N (actual QPE requires many qubits)"""
    if N < 4 or N % 2 == 0:
        return {"error": "N must be odd composite number >= 9"}

    # Classical part: find period using small simulation
    import math
    a = 2  # coprime base
    while math.gcd(a, N) != 1:
        a += 1

    # Find period r such that a^r ≡ 1 (mod N)
    r = 1
    while pow(a, r, N) != 1 and r < 1000:
        r += 1

    if r % 2 != 0:
        return {"N": N, "a": a, "period": r, "status": "odd_period_retry"}

    x = pow(a, r // 2, N)
    f1 = math.gcd(x + 1, N)
    f2 = math.gcd(x - 1, N)

    return {
        "N": N,
        "a": a,
        "period": r,
        "factors": [f1, f2] if f1 * f2 == N else None,
        "status": "success" if f1 * f2 == N else "failed",
        "circuit_qubits_needed": 2 * int(math.log2(N)) + 3,
    }
