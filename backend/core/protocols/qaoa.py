"""QAOA — Quantum Approximate Optimization Algorithm (Qiskit implementation)"""

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np
import math


def run_qaoa(
    graph_edges: list[list[int]],
    gamma: float = 0.8,
    beta: float = 0.4,
    p: int = 1,
    shots: int = 2048,
) -> dict:
    """
    Run QAOA for MaxCut on the given graph.

    Args:
        graph_edges: List of [u, v] edges
        gamma: Problem unitary angle
        beta: Mixing unitary angle
        p: Number of QAOA layers
        shots: Measurement shots
    """
    edges = [(e[0], e[1]) for e in graph_edges]
    n_nodes = max(max(u, v) for u, v in edges) + 1

    qc = QuantumCircuit(n_nodes)

    # Initial superposition
    qc.h(range(n_nodes))

    # QAOA layers
    for layer in range(p):
        g = gamma
        b = beta

        # Problem unitary: exp(-i * gamma * C)
        for u, v in edges:
            qc.cx(u, v)
            qc.rz(2 * g, v)
            qc.cx(u, v)

        # Mixer unitary: exp(-i * beta * B)
        for q in range(n_nodes):
            qc.rx(2 * b, q)

    qc.measure_all()

    backend = AerSimulator()
    job = backend.run(transpile(qc, backend), shots=shots)
    result = job.result()
    counts = result.get_counts()

    # Evaluate MaxCut cost for each bitstring
    cut_values = {}
    for bitstring, count in counts.items():
        bits = [int(b) for b in bitstring[::-1]]  # Reverse for qubit ordering
        cut = sum(1 for u, v in edges if bits[u] != bits[v])
        cut_values[bitstring] = cut

    # Best cut found
    best_bitstring = max(cut_values, key=cut_values.get)
    best_cut = cut_values[best_bitstring]
    max_possible_cut = len(edges)

    # Expected cost
    expected_cost = sum(
        cut_values[bs] * counts[bs] for bs in counts
    ) / shots

    return {
        "n_nodes": n_nodes,
        "n_edges": len(edges),
        "gamma": gamma,
        "beta": beta,
        "layers": p,
        "counts": counts,
        "cut_values": cut_values,
        "best_bitstring": best_bitstring,
        "best_cut": best_cut,
        "max_possible_cut": max_possible_cut,
        "expected_cost": expected_cost,
        "approximation_ratio": expected_cost / max_possible_cut if max_possible_cut > 0 else 0,
    }


def qaoa_landscape(
    graph_edges: list[list[int]],
    resolution: int = 20,
    shots: int = 512,
) -> dict:
    """Generate a cost landscape over gamma/beta parameter space"""
    edges = [(e[0], e[1]) for e in graph_edges]
    n_nodes = max(max(u, v) for u, v in edges) + 1

    gammas = np.linspace(0, np.pi, resolution).tolist()
    betas = np.linspace(0, np.pi / 2, resolution).tolist()

    landscape = []
    for g in gammas:
        row = []
        for b in betas:
            result = run_qaoa(graph_edges, gamma=g, beta=b, p=1, shots=shots)
            row.append(result["expected_cost"])
        landscape.append(row)

    return {
        "gammas": gammas,
        "betas": betas,
        "landscape": landscape,
        "n_nodes": n_nodes,
    }
