# ============================================================
# Veto Algorithm — QuNetSim
# Multi-party quantum voting: any voter can veto anonymously.
# |1⟩ = VETO, |0⟩ = PASS. Tallier detects veto without knowing who.
# ============================================================
from qunetsim.components import Host, Network
from qunetsim.objects import Qubit
import time

VOTERS = ['Alice', 'Bob', 'Charlie']
TALLIER = 'Tally'

def voter_behavior(host, target, vote):
    q = Qubit(host)
    if vote == 1:
        q.X()  # |1⟩ = VETO
    print(f"[{host.host_id}] Sending vote={'VETO' if vote else 'PASS'}")
    host.send_qubit(target, q, await_ack=True)

def main():
    # 1. Build star-topology network
    network = Network.get_instance()
    network.start(VOTERS + [TALLIER])

    hosts = {}
    for name in VOTERS:
        h = Host(name)
        h.add_connection(TALLIER)
        h.start()
        hosts[name] = h

    tallier = Host(TALLIER)
    for v in VOTERS:
        tallier.add_connection(v)
    tallier.start()
    hosts[TALLIER] = tallier

    for h in hosts.values():
        network.add_host(h)

    # 2. Define votes — change any to 1 to trigger a veto
    votes = {'Alice': 0, 'Bob': 0, 'Charlie': 1}

    # 3. Each voter sends their qubit
    for name, vote in votes.items():
        voter_behavior(hosts[name], TALLIER, vote)

    time.sleep(2)

    # 4. Tallier collects and measures
    print("\n[Tallier] Collecting votes...")
    veto_detected = False
    for name in VOTERS:
        q = tallier.get_qubit(name, wait=5)
        if q:
            result = q.measure()
            print(f"[Tallier] {name}: {'VETO' if result else 'PASS'}")
            if result == 1:
                veto_detected = True

    # 5. Announce result
    print(f"\n[Tallier] RESULT: {'VETOED' if veto_detected else 'UNANIMOUS PASS'}")
    network.stop(stop_hosts=True)

if __name__ == '__main__':
    main()
