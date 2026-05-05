import type { WorkspaceTemplate } from "@/lib/workspace/types"
import type { TopicCatalogEntry, TopicInputConfig } from "@/lib/learning/topicCatalog"

export type TopicInputValue = string | number
type PreviewEngine = "custom" | "openqasm" | "qunetsim"

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

function buildDeutschOpenQasmCode(mode: string) {
  const oracleBlock =
    mode === "constant-0"
      ? "// Oracle: f(x)=0\n// No oracle action needed"
      : mode === "constant-1"
        ? "// Oracle: f(x)=1\nx q[1];"
        : "// Oracle: balanced f(x)=x\ncx q[0], q[1];"

  return `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;
bit[1] c;

x q[1];
h q[0];
h q[1];

${oracleBlock}

h q[0];
c[0] = measure q[0];`
}

function buildDeutschJozsaOpenQasmCode(qubits: number, oracleMode: string) {
  const ancilla = qubits
  const hadamards = Array.from({ length: qubits + 1 }, (_, index) => `h q[${index}];`).join("\n")
  const inputHadamards = Array.from({ length: qubits }, (_, index) => `h q[${index}];`).join("\n")
  const oracle =
    oracleMode === "constant"
      ? "// Oracle: constant\n// No controlled flips"
      : Array.from({ length: qubits }, (_, index) => `cx q[${index}], q[${ancilla}];`).join("\n")
  const measures = Array.from({ length: qubits }, (_, index) => `c[${index}] = measure q[${index}];`).join("\n")

  return `OPENQASM 3.0;
include "stdgates.inc";

qubit[${qubits + 1}] q;
bit[${qubits}] c;

x q[${ancilla}];
${hadamards}

${oracle}

${inputHadamards}
${measures}`
}

function buildBernsteinVaziraniOpenQasmCode(secret: string, qubits: number) {
  const ancilla = qubits
  const hadamards = Array.from({ length: qubits + 1 }, (_, index) => `h q[${index}];`).join("\n")
  const inputHadamards = Array.from({ length: qubits }, (_, index) => `h q[${index}];`).join("\n")
  const oracle = secret
    .split("")
    .map((bit, index) => (bit === "1" ? `cx q[${index}], q[${ancilla}];` : ""))
    .filter(Boolean)
    .join("\n") || "// Secret string is all zeros"
  const measures = Array.from({ length: qubits }, (_, index) => `c[${index}] = measure q[${index}];`).join("\n")

  return `OPENQASM 3.0;
include "stdgates.inc";

qubit[${qubits + 1}] q;
bit[${qubits}] c;

x q[${ancilla}];
${hadamards}

${oracle}

${inputHadamards}
${measures}`
}

function buildSimonOpenQasmCode(qubits: number) {
  const totalQubits = qubits * 2
  const inputHadamards = Array.from({ length: qubits }, (_, index) => `h q[${index}];`).join("\n")
  const measures = Array.from({ length: qubits }, (_, index) => `c[${index}] = measure q[${index}];`).join("\n")
  const oracle =
    qubits === 2
      ? ["cx q[0], q[2];", "cx q[1], q[3];", "cx q[0], q[3];", "cx q[1], q[2];"].join("\n")
      : ["cx q[0], q[3];", "cx q[1], q[4];", "cx q[2], q[5];", "cx q[0], q[5];", "cx q[2], q[3];"].join("\n")

  return `OPENQASM 3.0;
include "stdgates.inc";

qubit[${totalQubits}] q;
bit[${qubits}] c;

${inputHadamards}

${oracle}

${inputHadamards}
${measures}`
}

function buildGroverOpenQasmCode(target: string, qubits: number) {
  const hadamards = Array.from({ length: qubits }, (_, index) => `h q[${index}];`).join("\n")
  const xPrep = target
    .split("")
    .map((bit, index) => (bit === "0" ? `x q[${index}];` : ""))
    .filter(Boolean)
    .join("\n")
  const xUnprep = xPrep
  const oracle =
    qubits === 2
      ? [xPrep, "cz q[0], q[1];", xUnprep].filter(Boolean).join("\n")
      : [xPrep, "h q[2];", "ccx q[0], q[1], q[2];", "h q[2];", xUnprep].filter(Boolean).join("\n")
  const diffuser =
    qubits === 2
      ? [`${hadamards}`, "x q[0];", "x q[1];", "cz q[0], q[1];", "x q[0];", "x q[1];", `${hadamards}`].join("\n")
      : [
          `${hadamards}`,
          "x q[0];",
          "x q[1];",
          "x q[2];",
          "h q[2];",
          "ccx q[0], q[1], q[2];",
          "h q[2];",
          "x q[0];",
          "x q[1];",
          "x q[2];",
          `${hadamards}`,
        ].join("\n")
  const measures = Array.from({ length: qubits }, (_, index) => `c[${index}] = measure q[${index}];`).join("\n")

  return `OPENQASM 3.0;
include "stdgates.inc";

qubit[${qubits}] q;
bit[${qubits}] c;

${hadamards}

${oracle}

${diffuser}

${measures}`
}

function buildQftOpenQasmCode(qubits: number) {
  const inputInit = "x q[0];"
  const lines: string[] = [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    "",
    `qubit[${qubits}] q;`,
    `bit[${qubits}] c;`,
    "",
    inputInit,
    "",
  ]

  for (let target = 0; target < qubits; target += 1) {
    lines.push(`h q[${target}];`)
    for (let control = target + 1; control < qubits; control += 1) {
      const angle = Math.PI / (2 ** (control - target))
      lines.push(`cp(${angle}) q[${control}], q[${target}];`)
    }
    lines.push("")
  }

  for (let index = 0; index < Math.floor(qubits / 2); index += 1) {
    lines.push(`swap q[${index}], q[${qubits - 1 - index}];`)
  }
  lines.push("")

  for (let index = 0; index < qubits; index += 1) {
    lines.push(`c[${index}] = measure q[${index}];`)
  }

  return lines.join("\n")
}

function buildBb84QuNetSimCode(keyLength: number) {
  return `from qunetsim.components import Host, Network
from qunetsim.objects import Qubit
import time

KEY_LENGTH = ${keyLength}

def main():
    network = Network.get_instance()
    network.start(["Alice", "Bob", "Eve"])

    alice = Host("Alice")
    alice.add_connection("Eve")
    alice.start()

    eve = Host("Eve")
    eve.add_connection("Alice")
    eve.add_connection("Bob")
    eve.start()

    bob = Host("Bob")
    bob.add_connection("Eve")
    bob.start()

    network.add_host(alice)
    network.add_host(eve)
    network.add_host(bob)

    print(f"[BB84] Running {KEY_LENGTH} rounds with Eve intercepting.")
    for round_index in range(KEY_LENGTH):
        q = Qubit(alice)
        if round_index % 2 == 0:
            q.H()
        alice.send_qubit("Eve", q, await_ack=True)
        time.sleep(0.05)
        intercepted = eve.get_qubit("Alice", wait=5)
        if intercepted is None:
            continue
        eve_result = intercepted.measure()
        resent = Qubit(eve)
        if eve_result == 1:
            resent.X()
        eve.send_qubit("Bob", resent, await_ack=True)

    time.sleep(1)
    for round_index in range(KEY_LENGTH):
        received = bob.get_qubit("Eve", wait=1)
        if received is None:
            continue
        print(f"[Bob] Round {round_index}: {received.measure()}")

    network.stop(stop_hosts=True)

if __name__ == "__main__":
    main()`
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

export function buildPreviewCode(
  topic: TopicCatalogEntry,
  values: Record<string, TopicInputValue>,
  catalogTemplate: WorkspaceTemplate | null,
  engine: PreviewEngine = "custom",
) {
  if (engine === "openqasm") {
    if (topic.id === "deutsch") {
      return buildDeutschOpenQasmCode(String(values.fx ?? "balanced"))
    }
    if (topic.id === "deutsch-jozsa") {
      return buildDeutschJozsaOpenQasmCode(Number(values.qubits ?? 3), String(values.fx ?? "balanced"))
    }
    if (topic.id === "bernstein-vazirani") {
      return buildBernsteinVaziraniOpenQasmCode(String(values.secret ?? "110"), Number(values.qubits ?? 3))
    }
    if (topic.id === "simons-algorithm") {
      return buildSimonOpenQasmCode(Number(values.qubits ?? 2))
    }
    if (topic.id === "grovers-search") {
      return buildGroverOpenQasmCode(String(values.target ?? "11"), Number(values.qubits ?? 2))
    }
    if (topic.id === "qft") {
      return buildQftOpenQasmCode(Number(values.qubits ?? 3))
    }
  }

  if (engine === "qunetsim" && topic.id === "bb84") {
    return buildBb84QuNetSimCode(Number(values.key_length ?? 8))
  }

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
