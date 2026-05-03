# ============================================================
# Quantum Teleportation — QuNetSim
# Alice teleports an unknown qubit state to Bob via entanglement.
# ============================================================
from qunetsim.components import Host, Network
from qunetsim.objects import Qubit
import time

def main():
    # 1. Build Network: Alice <-> Bob
    network = Network.get_instance()
    nodes = ['Alice', 'Bob']
    network.start(nodes)

    alice = Host('Alice')
    alice.add_connection('Bob')
    alice.start()

    bob = Host('Bob')
    bob.add_connection('Alice')
    bob.start()

    network.add_host(alice)
    network.add_host(bob)

    # 2. Alice prepares the qubit to teleport (X applied → |1⟩ demo)
    q = Qubit(alice)
    q.X()  # Set state to |1⟩; remove for |0⟩

    # 3. Alice teleports qubit to Bob
    #    Internally: Bell pair creation, Bell measurement, classical correction
    print("[Alice] Teleporting qubit to Bob...")
    alice.send_teleport(bob.host_id, q)

    # 4. Bob receives the teleported qubit
    time.sleep(1)
    received = bob.get_qubit(alice.host_id, wait=5)

    if received is not None:
        print(f"[Bob] Received qubit. Measured: {received.measure()}")
    else:
        print("[Bob] No qubit received.")

    # 5. Teardown
    network.stop(stop_hosts=True)

if __name__ == '__main__':
    main()
