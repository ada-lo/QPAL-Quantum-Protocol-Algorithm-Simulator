import algorithms from "@/data/algorithms.json"

export type TopicTrackId = "algorithms" | "protocols"

export interface TopicStep {
  title: string
  description: string
}

export interface TopicInputOption {
  label: string
  value: string
}

export interface TopicInputConfig {
  id: string
  label: string
  type: "dropdown" | "text" | "number"
  defaultValue: string | number
  options?: TopicInputOption[]
  placeholder?: string
  min?: number
  max?: number
  maxLength?: number
  validation?: "binary"
}

export interface TopicCatalogEntry {
  id: string
  name: string
  wikipedia_query: string
  arxiv_query: string
  fallback_description: string
  complexity: string
  catalog_key: string
  steps: TopicStep[]
  prerequisites: string[]
  inputs?: TopicInputConfig[]
  templates?: Record<string, string>
}

export interface TopicTrack {
  id: TopicTrackId
  title: string
  topics: TopicCatalogEntry[]
}

const topicEntries = algorithms as TopicCatalogEntry[]

const topicById = new Map(topicEntries.map((topic) => [topic.id, topic] as const))

const ALGORITHM_TOPIC_IDS = [
  "deutsch",
  "deutsch-jozsa",
  "bernstein-vazirani",
  "simons-algorithm",
  "grovers-search",
  "qft",
  "quantum-phase-estimation",
  "shors-algorithm",
  "hhl-algorithm",
  "qsvm",
  "qkmean",
  "qknn",
  "qhc",
  "qpca",
  "qperceptron",
  "qnn",
  "qaoa-maxcut",
  "vqe-ansatz-h2",
  "quantum-walk-1d",
  "qec-3-qubit-repetition-code",
  "qec-shors-nine-qubit-code",
]

const PROTOCOL_TOPIC_IDS = [
  "bb84",
  "quantum-teleportation",
  "superdense-coding",
  "n-qubit-teleportation",
  "veto-algorithm",
  "qpc-socialist-millionaire",
]

function requireTopic(id: string) {
  const topic = topicById.get(id)
  if (!topic) {
    throw new Error(`Missing topic entry for ${id}`)
  }
  return topic
}

export const TOPIC_TRACKS: TopicTrack[] = [
  {
    id: "algorithms",
    title: "Algorithms",
    topics: ALGORITHM_TOPIC_IDS.map(requireTopic),
  },
  {
    id: "protocols",
    title: "Protocols",
    topics: PROTOCOL_TOPIC_IDS.map(requireTopic),
  },
]

export function getTopicTracks() {
  return TOPIC_TRACKS
}

export function getTopicById(id: string) {
  return topicById.get(id) ?? null
}

export function getTopicLabel(id: string) {
  return topicById.get(id)?.name ?? id
}

export function isProtocolTopic(id: string) {
  return PROTOCOL_TOPIC_IDS.includes(id)
}
