"""GPU detection utility using nvidia-smi (no Python GPU libraries required)."""

from __future__ import annotations

import subprocess
import logging

logger = logging.getLogger(__name__)


def get_gpu_info() -> dict:
    """Detect NVIDIA GPU via nvidia-smi CLI.

    Returns a dict with keys: available, name, memory, driver.
    Falls back gracefully if nvidia-smi is not found.
    """
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,driver_version",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            logger.debug("nvidia-smi returned non-zero: %s", result.stderr.strip())
            return {"available": False, "name": None, "memory": None, "driver": None}

        line = result.stdout.strip().split("\n")[0]  # first GPU
        parts = [p.strip() for p in line.split(",")]

        if len(parts) >= 3:
            name = parts[0]
            memory_mib = parts[1]
            driver = parts[2]
            # Convert MiB to a human-friendly string
            try:
                mem_val = int(float(memory_mib))
                memory_str = f"{mem_val} MiB" if mem_val < 1024 else f"{mem_val / 1024:.1f} GiB"
            except (ValueError, TypeError):
                memory_str = f"{memory_mib} MiB"

            return {
                "available": True,
                "name": name,
                "memory": memory_str,
                "driver": driver,
            }

        logger.debug("nvidia-smi output could not be parsed: %s", line)
        return {"available": False, "name": None, "memory": None, "driver": None}

    except FileNotFoundError:
        logger.debug("nvidia-smi not found on PATH")
        return {"available": False, "name": None, "memory": None, "driver": None}
    except subprocess.TimeoutExpired:
        logger.warning("nvidia-smi timed out")
        return {"available": False, "name": None, "memory": None, "driver": None}
    except Exception as exc:
        logger.warning("GPU detection failed: %s", exc)
        return {"available": False, "name": None, "memory": None, "driver": None}
