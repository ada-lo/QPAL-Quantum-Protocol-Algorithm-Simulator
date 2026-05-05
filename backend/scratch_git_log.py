import subprocess
with open("scratch.txt", "w", encoding="utf-8") as f:
    result = subprocess.run(["git", "log", "-p", "--", "backend/core/engines/qunetsim_engine.py"], capture_output=True, text=True)
    f.write(result.stdout)
