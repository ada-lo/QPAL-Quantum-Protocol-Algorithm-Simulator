import { useNoiseStore } from "@/store/noiseStore"
import { NOISE_MODELS } from "@/lib/noise/models"

export function useNoise() {
  const store = useNoiseStore()
  const model = NOISE_MODELS.find(m => m.id === store.activeModel)!
  return { ...store, model, allModels: NOISE_MODELS }
}
