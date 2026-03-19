"""QDD simulation engine — delegates to mqt.ddsim"""
from core.engines.qdd_engine_wrapper import QDDEngineWrapper

class QDDEngine(QDDEngineWrapper):
    """Alias for explicit QDD routing"""
    pass
