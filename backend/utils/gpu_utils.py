import subprocess

def get_gpu_info() -> dict:
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0:
            parts = result.stdout.strip().split(",")
            return {"available": True, "name": parts[0].strip(), "memory": parts[1].strip(), "driver": parts[2].strip()}
    except Exception:
        pass
    return {"available": False}
