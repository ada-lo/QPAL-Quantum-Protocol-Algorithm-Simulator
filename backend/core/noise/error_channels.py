"""Kraus operator definitions for custom error channels"""
import numpy as np

def depolarizing_kraus(p: float):
    I = np.eye(2) * np.sqrt(1 - p)
    X = np.array([[0,1],[1,0]]) * np.sqrt(p/3)
    Y = np.array([[0,-1j],[1j,0]]) * np.sqrt(p/3)
    Z = np.array([[1,0],[0,-1]]) * np.sqrt(p/3)
    return [I, X, Y, Z]

def amplitude_damping_kraus(gamma: float):
    K0 = np.array([[1, 0], [0, np.sqrt(1 - gamma)]])
    K1 = np.array([[0, np.sqrt(gamma)], [0, 0]])
    return [K0, K1]

def phase_damping_kraus(gamma: float):
    K0 = np.array([[1, 0], [0, np.sqrt(1 - gamma)]])
    K1 = np.array([[0, 0], [0, np.sqrt(gamma)]])
    return [K0, K1]
