/** Maps template IDs to their engine-specific code strings. */
export const languagePresets: Record<string, { custom?: string; openqasm?: string; qunetsim?: string }> = {
  bell_state: {
    openqasm:
      `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nh q[0];\ncx q[0], q[1];\nmeasure q -> c;`,
    qunetsim:
      `from qunetsim.components import Host, Network\nfrom qunetsim.objects import Qubit\nnetwork = Network.get_instance()\nnetwork.start()\nalice = Host('Alice')\nbob = Host('Bob')\nnetwork.add_hosts([alice, bob])\nq = Qubit(alice)\nq.H()\nalice.send_qubit(bob.host_id, q)`,
  },
  bell_pair: {
    openqasm:
      `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\nh q[0];\ncx q[0], q[1];\nmeasure q -> c;`,
    qunetsim:
      `from qunetsim.components import Host, Network\nfrom qunetsim.objects import Qubit\nnetwork = Network.get_instance()\nnetwork.start()\nalice = Host('Alice')\nbob = Host('Bob')\nnetwork.add_hosts([alice, bob])\nq = Qubit(alice)\nq.H()\nalice.send_qubit(bob.host_id, q)`,
  },
  teleportation: {
    openqasm:
      `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nbit[2] c;\n// Teleportation circuit\nh q[1];\ncx q[1], q[2];\ncx q[0], q[1];\nh q[0];\nmeasure q[0] -> c[0];\nmeasure q[1] -> c[1];`,
    qunetsim:
      `from qunetsim.components import Host, Network\n# QuNetSim Teleportation\nnetwork = Network.get_instance()\nalice = Host('Alice')\nbob = Host('Bob')\nnetwork.add_hosts([alice, bob])\nnetwork.start()\nalice.send_epr(bob.host_id)`,
  },
  teleportation_simplified: {
    openqasm:
      `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nbit[2] c;\nh q[1];\ncx q[1], q[2];\ncx q[0], q[1];\nh q[0];\nmeasure q[0] -> c[0];\nmeasure q[1] -> c[1];`,
    qunetsim:
      `from qunetsim.components import Host, Network\nnetwork = Network.get_instance()\nalice = Host('Alice')\nbob = Host('Bob')\nnetwork.add_hosts([alice, bob])\nnetwork.start()\nalice.send_epr(bob.host_id)`,
  },
  bb84_eavesdrop: {
    openqasm:
      `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[1] q;\nbit[1] c;\n// BB84: Alice prepares, Eve intercepts\nh q[0];\nmeasure q[0] -> c[0];`,
    qunetsim:
      `from qunetsim.components import Host, Network\nfrom qunetsim.objects import Qubit\nnetwork = Network.get_instance()\nnetwork.start()\nalice = Host('Alice')\neve = Host('Eve')\nbob = Host('Bob')\nnetwork.add_hosts([alice, eve, bob])\nq = Qubit(alice)\nq.H()\nalice.send_qubit(eve.host_id, q)`,
  },
  grover_search: {
    openqasm:
      `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\n// Grover oracle + diffuser\nh q[0];\nh q[1];\ncx q[0], q[1];\nh q[0];\nmeasure q -> c;`,
  },
  superdense_simplified: {
    openqasm:
      `OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nbit[2] c;\n// Superdense coding: encode 2 classical bits in 1 qubit\nh q[0];\ncx q[0], q[1];\n// Encode message (e.g. "11"): z q[0]; x q[0];\nmeasure q -> c;`,
    qunetsim:
      `from qunetsim.components import Host, Network\nfrom qunetsim.objects import Qubit\nnetwork = Network.get_instance()\nnetwork.start()\nalice = Host('Alice')\nbob = Host('Bob')\nnetwork.add_hosts([alice, bob])\n# Alice encodes 2 bits and sends 1 qubit\nq = Qubit(alice)\nalice.send_superdense(bob.host_id, '11')`,
  },
}

/** Fallback code when no preset exists for a given engine */
export const PRESET_UNAVAILABLE = (engine: string) =>
  `// Template not yet available in ${engine}.\n// Please write your ${engine === 'qunetsim' ? 'Python / QuNetSim' : 'OpenQASM 3.0'} code here.`
