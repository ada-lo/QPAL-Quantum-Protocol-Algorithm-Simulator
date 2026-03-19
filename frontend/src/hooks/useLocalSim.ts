import { useEffect, useRef } from "react"
import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore } from "@/store/simStore"
import { runCircuit, blochVector, type StepSnapshot } from "@/lib/quantum/simulator"
import type { Complex } from "@/lib/quantum/stateVector"

// Debounce helper
function useDebounce(fn: () => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  return () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(fn, delay)
  }
}

export function useLocalSim() {
  const { nQubits, gates, currentStep } = useCircuitStore()
  const { setResult, setEngineUsed, snapshots, setSnapshots } = useSimStore() as any

  const run = () => {
    if (nQubits > 6 || gates.length === 0) return
    const snaps = runCircuit(nQubits, gates)
    // Store all snapshots
    if (setSnapshots) setSnapshots(snaps)

    const last = snaps[snaps.length - 1]
    if (!last) return

    const dim = 1 << nQubits
    const stateVector = Array.from({ length: dim }, (_, i) => ({
      re: last.sv[2*i], im: last.sv[2*i+1]
    }))
    const probabilities = Array.from(last.probs)
    const blochVectors = Array.from({ length: nQubits }, (_, q) => blochVector(last.sv, nQubits, q))

    setResult({ stateVector, probabilities, fidelity: 1.0, nQubits, shots: 0, blochVectors })
    setEngineUsed("local-wasm")
  }

  const debouncedRun = useDebounce(run, 80)

  useEffect(() => {
    debouncedRun()
  }, [nQubits, JSON.stringify(gates)])

  return { run }
}
