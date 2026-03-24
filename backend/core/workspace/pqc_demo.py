"""Post-Quantum Cryptography demo module — optional liboqs integration.

Compares classical vs post-quantum key exchange and signature generation.

Dependencies: pip install liboqs-python
"""
from __future__ import annotations

import time
from typing import Any


def _try_liboqs() -> Any | None:
    """Lazily import liboqs."""
    try:
        import oqs
        return oqs
    except ImportError:
        return None


def run_pqc_comparison() -> dict:
    """Run PQC key exchange and signature demos, comparing timing data."""
    oqs = _try_liboqs()

    if oqs is None:
        return {
            "available": False,
            "error": "liboqs-python not installed. Run: pip install liboqs-python",
            "kem_results": [],
            "sig_results": [],
        }

    kem_results = []
    sig_results = []

    # ── Key Encapsulation Mechanisms ──────────────────────────────────────
    kem_algos = ["Kyber512", "Kyber768", "Kyber1024"]
    for algo_name in kem_algos:
        try:
            kem = oqs.KeyEncapsulation(algo_name)

            # Key generation
            t0 = time.perf_counter()
            public_key = kem.generate_keypair()
            keygen_ms = (time.perf_counter() - t0) * 1000

            # Encapsulation
            t0 = time.perf_counter()
            ciphertext, shared_secret_enc = kem.encap_secret(public_key)
            encap_ms = (time.perf_counter() - t0) * 1000

            # Decapsulation
            t0 = time.perf_counter()
            shared_secret_dec = kem.decap_secret(ciphertext)
            decap_ms = (time.perf_counter() - t0) * 1000

            kem_results.append({
                "algorithm": algo_name,
                "keygen_ms": round(keygen_ms, 3),
                "encap_ms": round(encap_ms, 3),
                "decap_ms": round(decap_ms, 3),
                "public_key_size": len(public_key),
                "ciphertext_size": len(ciphertext),
                "shared_secret_size": len(shared_secret_enc),
                "verified": shared_secret_enc == shared_secret_dec,
            })
        except Exception as e:
            kem_results.append({"algorithm": algo_name, "error": str(e)})

    # ── Digital Signatures ────────────────────────────────────────────────
    sig_algos = ["Dilithium2", "Dilithium3", "Falcon-512"]
    message = b"QPAL PQC Demo: The quick brown fox jumps over the lazy dog."

    for algo_name in sig_algos:
        try:
            sig = oqs.Signature(algo_name)

            # Key generation
            t0 = time.perf_counter()
            public_key = sig.generate_keypair()
            keygen_ms = (time.perf_counter() - t0) * 1000

            # Sign
            t0 = time.perf_counter()
            signature = sig.sign(message)
            sign_ms = (time.perf_counter() - t0) * 1000

            # Verify
            verifier = oqs.Signature(algo_name)
            t0 = time.perf_counter()
            valid = verifier.verify(message, signature, public_key)
            verify_ms = (time.perf_counter() - t0) * 1000

            sig_results.append({
                "algorithm": algo_name,
                "keygen_ms": round(keygen_ms, 3),
                "sign_ms": round(sign_ms, 3),
                "verify_ms": round(verify_ms, 3),
                "public_key_size": len(public_key),
                "signature_size": len(signature),
                "verified": valid,
            })
        except Exception as e:
            sig_results.append({"algorithm": algo_name, "error": str(e)})

    return {
        "available": True,
        "kem_results": kem_results,
        "sig_results": sig_results,
    }
