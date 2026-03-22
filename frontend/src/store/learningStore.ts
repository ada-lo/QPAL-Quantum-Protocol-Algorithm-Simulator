import { create } from "zustand"
import { getLearningExperience, LEARNING_EXPERIENCES } from "@/lib/quantum/learningCatalog"
import { useCircuitStore } from "./circuitStore"

interface LearningState {
  selectedId: string
  select: (id: string) => void
  loadIntoCircuit: (id: string) => void
}

export const useLearningStore = create<LearningState>((set) => ({
  selectedId: LEARNING_EXPERIENCES[0].id,
  select: (id) => set({ selectedId: id }),
  loadIntoCircuit: (id) => {
    const experience = getLearningExperience(id)
    useCircuitStore.getState().loadPreset(experience.gates, experience.nQubits, experience.initialStates)
    set({ selectedId: experience.id })
  },
}))
