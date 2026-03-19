import type { StateVector } from "./stateVector"
import { probability } from "./stateVector"

export function sampleMeasurement(sv: StateVector): number {
  const r = Math.random()
  let cumulative = 0
  for (let i = 0; i < sv.length; i++) {
    cumulative += probability(sv, i)
    if (r < cumulative) return i
  }
  return sv.length - 1
}

export function measurementProbabilities(sv: StateVector): number[] {
  return sv.map((_, i) => probability(sv, i))
}
