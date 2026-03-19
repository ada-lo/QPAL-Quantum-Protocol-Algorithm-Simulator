import { useMemo } from "react"
import { useSimStore } from "@/store/simStore"
import { blochAngles, zeroState } from "@/lib/quantum/stateVector"

export function useBloch(qubitIndex = 0) {
  const result = useSimStore(s => s.result)

  return useMemo(() => {
    if (result?.blochVectors?.[qubitIndex]) {
      return result.blochVectors[qubitIndex]
    }
    // Derive from state vector for single qubit
    if (result?.stateVector && result.nQubits === 1) {
      const sv = result.stateVector
      const { theta, phi } = blochAngles(sv)
      return {
        x: Math.sin(theta) * Math.cos(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(theta),
      }
    }
    return { x: 0, y: 0, z: 1 }  // |0⟩ default
  }, [result, qubitIndex])
}
