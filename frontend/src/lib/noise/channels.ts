// Kraus operator representations for noise channels (for local preview rendering)
export interface KrausChannel {
  label: string
  fidelityDecay: (p: number, depth: number) => number
}

export const depolarizingFidelity = (p: number, depth: number): number =>
  ((1 - p) ** depth + (1 - (1-p)**depth) * (1/3)) ** 0  // simplified trace fidelity

export const amplitudeDampingFidelity = (gamma: number, depth: number): number =>
  1 - gamma * depth

export const phaseFlipFidelity = (p: number, depth: number): number =>
  (1 - 2*p) ** depth
