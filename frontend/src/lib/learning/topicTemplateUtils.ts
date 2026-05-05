import type { WorkspaceTemplate } from "@/lib/workspace/types"
import type { TopicCatalogEntry, TopicInputConfig } from "@/lib/learning/topicCatalog"

export type TopicInputValue = string | number

export function buildInitialInputValues(topic: TopicCatalogEntry | null) {
  return Object.fromEntries((topic?.inputs ?? []).map((input) => [input.id, input.defaultValue])) as Record<string, TopicInputValue>
}

function replaceToken(source: string, token: string, value: string) {
  return source.split(token).join(value)
}

function buildVariantKey(topic: TopicCatalogEntry, values: Record<string, TopicInputValue>) {
  if (!topic.inputs || topic.inputs.length === 0) return "base"
  return topic.inputs
    .filter((input) => input.type === "dropdown")
    .map((input) => String(values[input.id] ?? input.defaultValue))
    .join("-")
}

export function validateInput(input: TopicInputConfig, rawValue: TopicInputValue, allValues: Record<string, TopicInputValue>) {
  const value = String(rawValue ?? "")

  if (input.type === "text" && input.validation === "binary" && /[^01]/.test(value)) {
    return "Only 0 and 1 are allowed."
  }

  if (input.type === "text" && input.validation === "binary") {
    const qubitValue = Number(allValues.qubits ?? 0)
    if (qubitValue > 0 && value.length !== qubitValue) {
      return `Enter exactly ${qubitValue} bits.`
    }
  }

  if (input.type === "number") {
    const numericValue = Number(rawValue)
    if (Number.isNaN(numericValue)) return "Enter a valid number."
    if (input.min !== undefined && numericValue < input.min) return `Minimum value is ${input.min}.`
    if (input.max !== undefined && numericValue > input.max) return `Maximum value is ${input.max}.`
  }

  return null
}

function buildBernsteinVaziraniCode(secret: string, qubits: number, template: string) {
  const initLines = Array.from({ length: qubits }, (_, index) => `INIT q${index}`).join("\n")
  const hLines = Array.from({ length: qubits }, (_, index) => `H q${index}`).join("\n")
  const oracleGates = secret
    .split("")
    .map((bit, index) => (bit === "1" ? `CNOT q${index} q${qubits}` : ""))
    .filter(Boolean)
    .join("\n") || "NOTE Secret string is all zeros"
  const measureLines = Array.from({ length: qubits }, (_, index) => `MEASURE q${index} BASIS Z`).join("\n")

  let next = template
  next = replaceToken(next, "{{SECRET}}", secret)
  next = replaceToken(next, "{{QUBITS}}", String(qubits))
  next = replaceToken(next, "{{INIT_LINES}}", initLines)
  next = replaceToken(next, "{{H_LINES}}", hLines)
  next = replaceToken(next, "{{FINAL_H_LINES}}", hLines)
  next = replaceToken(next, "{{ORACLE_GATES}}", oracleGates)
  next = replaceToken(next, "{{MEASURE_LINES}}", measureLines)
  return next
}

function buildGroverCode(target: string, qubits: number, template: string) {
  const initLines = Array.from({ length: qubits }, (_, index) => `INIT q${index}`).join("\n")
  const hLines = Array.from({ length: qubits }, (_, index) => `H q${index}`).join("\n")
  const measureLines = Array.from({ length: qubits }, (_, index) => `MEASURE q${index} BASIS Z`).join("\n")
  const xPrep = target
    .split("")
    .map((bit, index) => (bit === "0" ? `X q${index}` : ""))
    .filter(Boolean)
    .join("\n")
  const xUnprep = xPrep
  const oracleGates =
    qubits === 2
      ? [xPrep, "CZ q0 q1", xUnprep].filter(Boolean).join("\n")
      : [xPrep, "H q2", "TOFFOLI q0 q2 q1", "H q2", xUnprep].filter(Boolean).join("\n")
  const diffuserSteps = [
    hLines,
    Array.from({ length: qubits }, (_, index) => `X q${index}`).join("\n"),
    qubits === 2 ? "CZ q0 q1" : "H q2\nTOFFOLI q0 q2 q1\nH q2",
    Array.from({ length: qubits }, (_, index) => `X q${index}`).join("\n"),
    hLines,
  ].join("\n")

  let next = template
  next = replaceToken(next, "{{TARGET}}", target)
  next = replaceToken(next, "{{QUBITS}}", String(qubits))
  next = replaceToken(next, "{{INIT_LINES}}", initLines)
  next = replaceToken(next, "{{H_LINES}}", hLines)
  next = replaceToken(next, "{{ORACLE_GATES}}", oracleGates)
  next = replaceToken(next, "{{DIFFUSION_LINES}}", diffuserSteps)
  next = replaceToken(next, "{{MEASURE_LINES}}", measureLines)
  return next
}

export function buildPreviewCode(topic: TopicCatalogEntry, values: Record<string, TopicInputValue>, catalogTemplate: WorkspaceTemplate | null) {
  if (!topic.templates || Object.keys(topic.templates).length === 0) {
    return catalogTemplate?.code ?? ""
  }

  if (topic.id === "bernstein-vazirani") {
    const qubits = Number(values.qubits)
    const secret = String(values.secret)
    return buildBernsteinVaziraniCode(secret, qubits, topic.templates.base ?? catalogTemplate?.code ?? "")
  }

  if (topic.id === "grovers-search") {
    const qubits = Number(values.qubits)
    const target = String(values.target)
    return buildGroverCode(target, qubits, topic.templates.base ?? catalogTemplate?.code ?? "")
  }

  if (topic.id === "bb84") {
    return replaceToken(topic.templates.base ?? catalogTemplate?.code ?? "", "{{KEY_LENGTH}}", String(values.key_length))
  }

  const variantKey = buildVariantKey(topic, values)
  return topic.templates[variantKey] ?? topic.templates.base ?? catalogTemplate?.code ?? ""
}
