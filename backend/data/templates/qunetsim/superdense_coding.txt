# ============================================================
# Superdense Coding — QuNetSim
# Alice sends 2 classical bits to Bob using 1 qubit + entanglement.
# ============================================================
from qunetsim.components import Host, Network
from qunetsim.objects import Qubit
import time

def main():
    # 1. Build Network
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

    # 2. Classical message Alice wants to send (2 bits)
    message_bits = (1, 0)  # Change to (0,0), (0,1), (1,0), or (1,1)
    print(f"[Alice] Encoding classical bits: {message_bits}")

    # 3. Create Bell-pair qubit and encode 2 bits via Pauli gates
    q = Qubit(alice)
    q.H()                        # Superposition

    bit1, bit2 = message_bits
    if bit2 == 1:
        q.X()                    # Encode second bit
    if bit1 == 1:
        q.Z()                    # Encode first bit

    # 4. Alice sends encoded qubit to Bob
    alice.send_qubit(bob.host_id, q, await_ack=True)

    # 5. Bob decodes: CNOT + H then measures
    time.sleep(1)
    received = bob.get_qubit(alice.host_id, wait=5)

    if received:
        received.cnot(received)
        received.H()
        result = received.measure()
        print(f"[Bob] Decoded qubit measurement: {result}")
    else:
        print("[Bob] No qubit received.")

    network.stop(stop_hosts=True)

if __name__ == '__main__':
    main()
