import { getLearningExperience, LEARNING_EXPERIENCES, type LearningKind } from "@/lib/quantum/learningCatalog"

export type LearnerLabAction = "inputs" | "circuit" | "lab"
export type LearnerInspectorId = "studio" | "state" | "bloch" | "analysis" | "docs"

export interface LearnerApiCapabilities {
  simulate: boolean
  analysis: boolean
  benchmarks: boolean
  templateHydration: boolean
}

export interface LearnerTopicConfig {
  topicId: string
  kind: LearningKind
  title: string
  summary: string
  story: string[]
  experienceId: string
  engine: "custom" | "openqasm" | "qunetsim"
  templateId?: string
  enabledInspectors: LearnerInspectorId[]
  apiCapabilities: LearnerApiCapabilities
  defaultAction: LearnerLabAction
  hasGuidedInputs: boolean
}

export interface LearnerLaunchConfig {
  topicId: string
  category: LearningKind
  labAction: LearnerLabAction
  engine: "custom" | "openqasm" | "qunetsim"
  experienceId: string
  templateId?: string
  enabledInspectors: LearnerInspectorId[]
  apiCapabilities: LearnerApiCapabilities
  hasGuidedInputs: boolean
}

const TEMPLATE_BY_TOPIC: Partial<Record<string, string>> = {
  bb84: "bb84_eavesdrop",
  teleport: "teleportation_simplified",
  superdense: "superdense_simplified",
  qec: "qec_3qubit_repetition",
  grover: "grover_search",
  shor: "shor_factorization",
  qft: "qft_3qubit",
  qaoa: "qaoa_maxcut",
  dj: "deutsch_jozsa",
  bv: "bernstein_vazirani",
  simon: "simon",
  qpe: "qpe_simple",
  vqe: "vqe_h2",
  qwalk: "quantum_walk_1d",
}

const GUIDED_INPUT_TOPIC_IDS = new Set<string>(["bv"])

export const LEARNER_TOPICS: LearnerTopicConfig[] = LEARNING_EXPERIENCES.map((experience) => {
  const templateId = TEMPLATE_BY_TOPIC[experience.id]
  const analysisEnabled = experience.kind === "algorithm"

  return {
    topicId: experience.id,
    kind: experience.kind,
    title: experience.label,
    summary: experience.summary,
    story: experience.story,
    experienceId: experience.id,
    engine: "custom",
    templateId,
    enabledInspectors: analysisEnabled
      ? ["studio", "state", "bloch", "analysis", "docs"]
      : ["studio", "state", "bloch", "docs"],
    apiCapabilities: {
      simulate: true,
      analysis: analysisEnabled,
      benchmarks: false,
      templateHydration: Boolean(templateId),
    },
    defaultAction: GUIDED_INPUT_TOPIC_IDS.has(experience.id) ? "inputs" : "lab",
    hasGuidedInputs: GUIDED_INPUT_TOPIC_IDS.has(experience.id),
  }
})

export function isLearnerKind(value: string | undefined): value is LearningKind {
  return value === "algorithm" || value === "protocol"
}

export function getLearnerTopicsByKind(kind: LearningKind) {
  return LEARNER_TOPICS.filter((topic) => topic.kind === kind)
}

export function getLearnerTopicConfig(topicId: string) {
  return LEARNER_TOPICS.find((topic) => topic.topicId === topicId) ?? null
}

export function getLearnerLaunchConfig(topicId: string, action: LearnerLabAction): LearnerLaunchConfig | null {
  const topic = getLearnerTopicConfig(topicId)
  if (!topic) return null

  return {
    topicId: topic.topicId,
    category: topic.kind,
    labAction: action,
    engine: topic.engine,
    experienceId: topic.experienceId,
    templateId: topic.templateId,
    enabledInspectors: topic.enabledInspectors,
    apiCapabilities: topic.apiCapabilities,
    hasGuidedInputs: topic.hasGuidedInputs,
  }
}

export function getLearnerExperience(topicId: string) {
  return getLearningExperience(topicId)
}
