import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore } from "@/store/simStore"
import { useNoiseStore } from "@/store/noiseStore"

const API = import.meta.env.VITE_API_URL ?? ""

export function useCircuit() {
  const circuit = useCircuitStore()
  const sim = useSimStore()
  const noise = useNoiseStore()

  async function runSimulation() {
    if (circuit.gates.length === 0) return
    sim.setLoading(true)
    sim.setError(null)
    try {
      const gateOps = circuit.gates.map(g => ({
        gate_id: g.gateId,
        qubit: g.qubit,
        step: g.step,
        target_qubit: g.targetQubit ?? null,
        control_qubit: g.controlQubit ?? null,
        angle: g.angle ?? null,
      }))
      const body = {
        n_qubits: circuit.nQubits,
        gates: gateOps,
        noise_model: noise.activeModel,
        noise_params: noise.params,
        shots: 1024,
        return_qdd: circuit.nQubits > 6,
      }
      const res = await fetch(`${API}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      sim.setResult({
        stateVector: data.state_vector,
        probabilities: data.probabilities,
        fidelity: data.fidelity,
        nQubits: data.n_qubits,
        shots: data.shots,
        counts: data.counts,
        blochVectors: data.bloch_vectors,
        qddGraph: data.qdd_graph,
      })
      sim.setEngineUsed(data.engine_used)
    } catch (e) {
      sim.setError(e instanceof Error ? e.message : "Simulation failed")
    } finally {
      sim.setLoading(false)
    }
  }

  return {
    ...circuit,
    result: sim.result,
    loading: sim.loading,
    error: sim.error,
    runSimulation,
  }
}
