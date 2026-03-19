import { create } from "zustand"
import type { NoiseModelId } from "@/lib/noise/models"

export interface NoiseState {
  activeModel: NoiseModelId
  params: Record<string, number>
  showNoise: boolean
  setActiveModel: (id: NoiseModelId) => void
  setParam: (key: string, val: number) => void
  setShowNoise: (v: boolean) => void
}

export const useNoiseStore = create<NoiseState>((set) => ({
  activeModel: "ideal",
  params: { p: 0.01, gamma: 0.05, t1: 100, t2: 80, tgate: 50 },
  showNoise: false,
  setActiveModel: (id) => set({ activeModel: id }),
  setParam: (key, val) => set((s) => ({ params: { ...s.params, [key]: val } })),
  setShowNoise: (v) => set({ showNoise: v }),
}))
