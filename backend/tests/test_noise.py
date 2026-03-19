from core.noise.noise_models import build_noise_model
from core.noise.decoherence import fidelity_decay

def test_ideal_model():
    assert build_noise_model("ideal", {}) is None

def test_depolarizing_model():
    nm = build_noise_model("depolarizing", {"p": 0.01})
    assert nm is not None

def test_fidelity_decay_depolarizing():
    f0 = fidelity_decay("depolarizing", {"p": 0.01}, 0)
    f10 = fidelity_decay("depolarizing", {"p": 0.01}, 10)
    assert f0 == 1.0
    assert 0 < f10 < 1.0
    assert f10 < f0
