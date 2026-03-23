import { useEffect, useRef } from "react"
import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore } from "@/store/simStore"
import { runCircuit, blochVector, type StepSnapshot } from "@/lib/quantum/simulator"

// Debounce helper
function useDebounce(fn: () => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  return () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(fn, delay)
  }
}

export function useLocalSim() {
  const { nQubits, gates, initialStates } = useCircuitStore()
  const { setResult, setEngineUsed, setSnapshots } = useSimStore() as any

  const run = () => {
    if (gates.length === 0) {
      // Reset to initial state display
      setSnapshots?.([])
      setResult?.(null)
      return
    }

    // For ≤16 qubits, run client-side
    if (nQubits > 16) return

    try {
      const snaps = runCircuit(nQubits, gates, initialStates)
      if (setSnapshots) setSnapshots(snaps)

      const last = snaps[snaps.length - 1]
      if (!last) return

      const dim = 1 << nQubits
      const stateVector = Array.from({ length: dim }, (_, i) => ({
        re: last.sv[2 * i], im: last.sv[2 * i + 1]
      }))
      const probabilities = Array.from(last.probs)
      const blochVectors = nQubits <= 10
        ? Array.from({ length: nQubits }, (_, q) => blochVector(last.sv, nQubits, q))
        : undefined

      setResult({ stateVector, probabilities, fidelity: 1.0, nQubits, shots: 0, blochVectors })
      setEngineUsed("local-wasm")
    } catch (e) {
      console.error("Simulation error:", e)
    }
  }

  const debouncedRun = useDebounce(run, 50)  // 50ms debounce for responsiveness

  useEffect(() => {
    debouncedRun()
  }, [nQubits, JSON.stringify(gates), JSON.stringify(initialStates)])

  return { run }
}
