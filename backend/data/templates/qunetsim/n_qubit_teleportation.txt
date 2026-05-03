# ============================================================
# Quantum N-Qubit Teleportation — QuNetSim
# Alice teleports an n-qubit register to Bob sequentially.
# ============================================================
from qunetsim.components import Host, Network
from qunetsim.objects import Qubit
import time

N_QUBITS = 3  # Change to teleport more or fewer qubits

def main():
    # 1. Build network
    network = Network.get_instance()
    network.start(['Alice', 'Bob'])

    alice = Host('Alice')
    alice.add_connection('Bob')
    alice.start()

    bob = Host('Bob')
    bob.add_connection('Alice')
    bob.start()

    network.add_host(alice)
    network.add_host(bob)

    # 2. Alice prepares n-qubit register (alternating |1⟩ and |0⟩)
    print(f"[Alice] Preparing {N_QUBITS}-qubit register...")
    qubits = []
    for i in range(N_QUBITS):
        q = Qubit(alice)
        if i % 2 == 0:
            q.X()
        qubits.append(q)
        print(f"  Qubit {i}: {'|1>' if i%2==0 else '|0>'}")

    # 3. Teleport each qubit
    print(f"\n[Alice] Teleporting {N_QUBITS} qubits...")
    for i, q in enumerate(qubits):
        alice.send_teleport(bob.host_id, q)
        time.sleep(0.5)
        print(f"  Qubit {i} sent.")

    # 4. Bob collects and measures
    time.sleep(2)
    print(f"\n[Bob] Collecting qubits...")
    for i in range(N_QUBITS):
        received = bob.get_qubit(alice.host_id, wait=5)
        if received:
            print(f"  Qubit {i} measured: {received.measure()}")
        else:
            print(f"  Qubit {i}: Not received.")

    network.stop(stop_hosts=True)

if __name__ == '__main__':
    main()
