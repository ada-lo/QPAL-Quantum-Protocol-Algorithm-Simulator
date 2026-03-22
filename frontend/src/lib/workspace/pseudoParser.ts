import type {
  WorkspaceInstruction,
  WorkspaceParserIssue,
  WorkspaceParserResult,
} from "./types"

const COMMENT_PATTERNS = [/^\s*#/, /^\s*\/\//]
const QUBIT_PATTERN = /^q\d+$/i
const ACTOR_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/
const INIT_STATES = new Set(["0", "1", "+", "-"])
const ANGLE_PATTERN = /^[-+]?(\d+(\.\d+)?|\.\d+)$/

function normalizeLine(raw: string) {
  return raw.replace(/,/g, " ").trim()
}

function isComment(line: string) {
  return COMMENT_PATTERNS.some((pattern) => pattern.test(line))
}

function makeIssue(line: number, raw: string, message: string): WorkspaceParserIssue {
  return { line, raw, message }
}

function makeInstruction(input: Partial<WorkspaceInstruction> & Pick<WorkspaceInstruction, "line" | "raw" | "opcode">): WorkspaceInstruction {
  return {
    args: [],
    qubits: [],
    actors: [],
    basis: null,
    label: null,
    category: "quantum",
    metadata: {},
    ...input,
  }
}

function validateQubit(token: string) {
  return QUBIT_PATTERN.test(token)
}

function validateActor(token: string) {
  return ACTOR_PATTERN.test(token)
}

function parseMeasureBasis(tokens: string[]) {
  const cleaned = tokens.map((token) => token.replace(/[[\]]/g, "").toUpperCase())
  if (cleaned.length === 0) {
    return { basis: "Z" as const, consumed: 0 }
  }

  if (cleaned[0] === "BASIS" && (cleaned[1] === "X" || cleaned[1] === "Z")) {
    return { basis: cleaned[1] as "X" | "Z", consumed: 2 }
  }

  if (cleaned[0] === "X" || cleaned[0] === "Z") {
    return { basis: cleaned[0] as "X" | "Z", consumed: 1 }
  }

  return { basis: null, consumed: 0 }
}

function parseAngle(token: string) {
  const cleaned = token.trim()
  if (!ANGLE_PATTERN.test(cleaned)) {
    return null
  }
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function expandMacro(line: number, raw: string, opcode: string, qubits: string[]): WorkspaceInstruction[] {
  if (opcode === "SUPERPOSE") {
    return [
      makeInstruction({
        line,
        raw,
        opcode: "H",
        qubits: [qubits[0]],
        args: [qubits[0]],
        category: "quantum",
        metadata: { expanded_from: "SUPERPOSE" },
      }),
    ]
  }

  if (opcode === "ENTANGLE") {
    return [
      makeInstruction({
        line,
        raw,
        opcode: "H",
        qubits: [qubits[0]],
        args: [qubits[0]],
        category: "quantum",
        metadata: { expanded_from: "ENTANGLE" },
      }),
      makeInstruction({
        line,
        raw,
        opcode: "CNOT",
        qubits: [qubits[0], qubits[1]],
        args: [qubits[0], qubits[1]],
        category: "quantum",
        metadata: { expanded_from: "ENTANGLE" },
      }),
    ]
  }

  return [
    makeInstruction({
      line,
      raw,
      opcode: "INIT",
      qubits: [qubits[0]],
      args: [qubits[0]],
      category: "quantum",
      metadata: { state: "0", expanded_from: "BELL" },
    }),
    makeInstruction({
      line,
      raw,
      opcode: "INIT",
      qubits: [qubits[1]],
      args: [qubits[1]],
      category: "quantum",
      metadata: { state: "0", expanded_from: "BELL" },
    }),
    makeInstruction({
      line,
      raw,
      opcode: "H",
      qubits: [qubits[0]],
      args: [qubits[0]],
      category: "quantum",
      metadata: { expanded_from: "BELL" },
    }),
    makeInstruction({
      line,
      raw,
      opcode: "CNOT",
      qubits: [qubits[0], qubits[1]],
      args: [qubits[0], qubits[1]],
      category: "quantum",
      metadata: { expanded_from: "BELL" },
    }),
  ]
}

export function parsePseudoProgram(source: string): WorkspaceParserResult {
  const instructions: WorkspaceInstruction[] = []
  const errors: WorkspaceParserIssue[] = []
  const warnings: WorkspaceParserIssue[] = []
  const qubits = new Set<string>()
  const actors = new Set<string>()

  const lines = source.split(/\r?\n/)

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1
    const normalized = normalizeLine(rawLine)

    if (!normalized || isComment(normalized)) {
      return
    }

    const [commandToken = "", ...restTokens] = normalized.split(/\s+/)
    const opcode = commandToken.toUpperCase()
    const raw = rawLine.trim()

    if (opcode === "NOTE" || opcode === "LABEL") {
      const text = restTokens.join(" ").trim()
      if (!text) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires a description.`))
        return
      }
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          label: text,
          category: "annotation",
          metadata: {},
        }),
      )
      return
    }

    if (opcode === "BARRIER") {
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          category: "annotation",
        }),
      )
      return
    }

    if (opcode === "WAIT") {
      if (restTokens.length !== 1) {
        errors.push(makeIssue(lineNumber, raw, "WAIT requires exactly one numeric duration argument."))
        return
      }
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          category: "annotation",
          metadata: { duration: Number(restTokens[0]) || 1 },
        }),
      )
      return
    }

    if (opcode === "ACTOR") {
      if (restTokens.length !== 1) {
        errors.push(makeIssue(lineNumber, raw, "ACTOR requires exactly one actor name."))
        return
      }
      if (!validateActor(restTokens[0])) {
        errors.push(makeIssue(lineNumber, raw, "Actor names must start with a letter and use only letters, numbers, underscore, or dash."))
        return
      }
      actors.add(restTokens[0])
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          actors: [restTokens[0]],
          category: "actor",
        }),
      )
      return
    }

    if (opcode === "INIT") {
      if (restTokens.length < 1 || restTokens.length > 2) {
        errors.push(makeIssue(lineNumber, raw, "INIT requires a qubit and an optional state token."))
        return
      }
      const [qubit, state = "0"] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, "INIT requires a valid qubit like q0 or q1."))
        return
      }
      if (!INIT_STATES.has(state)) {
        errors.push(makeIssue(lineNumber, raw, "INIT supports only 0, 1, +, or - as state markers."))
        return
      }
      qubits.add(qubit)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          category: "quantum",
          metadata: { state },
        }),
      )
      return
    }

    if (opcode === "RESET") {
      if (restTokens.length !== 1) {
        errors.push(makeIssue(lineNumber, raw, "RESET requires exactly one qubit."))
        return
      }
      const [qubit] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, "RESET requires a valid qubit like q0 or q1."))
        return
      }
      qubits.add(qubit)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          category: "quantum",
        }),
      )
      return
    }

    if (["H", "X", "Y", "Z", "S", "T", "SDG", "TDG", "SX", "SUPERPOSE"].includes(opcode)) {
      if (restTokens.length !== 1) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires exactly one qubit.`))
        return
      }
      const [qubit] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires a valid qubit like q0 or q1.`))
        return
      }
      qubits.add(qubit)
      if (opcode === "SUPERPOSE") {
        instructions.push(...expandMacro(lineNumber, raw, opcode, [qubit]))
        warnings.push(makeIssue(lineNumber, raw, "SUPERPOSE was expanded to H."))
        return
      }
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          category: "quantum",
        }),
      )
      return
    }

    if (["RX", "RY", "RZ"].includes(opcode)) {
      if (restTokens.length !== 2) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires a qubit and a numeric angle.`))
        return
      }
      const [qubit, angleToken] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires a valid qubit like q0 or q1.`))
        return
      }
      const angle = parseAngle(angleToken)
      if (angle === null) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires a numeric angle like 1.5708.`))
        return
      }
      qubits.add(qubit)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          category: "quantum",
          metadata: { angle },
        }),
      )
      return
    }

    if (["CNOT", "SWAP", "CZ", "BELL", "ENTANGLE"].includes(opcode)) {
      if (restTokens.length !== 2) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires exactly two qubits.`))
        return
      }
      const [left, right] = restTokens
      if (!validateQubit(left) || !validateQubit(right)) {
        errors.push(makeIssue(lineNumber, raw, `${opcode} requires qubits like q0 q1.`))
        return
      }
      qubits.add(left)
      qubits.add(right)
      if (opcode === "BELL" || opcode === "ENTANGLE") {
        instructions.push(...expandMacro(lineNumber, raw, opcode, [left, right]))
        warnings.push(makeIssue(lineNumber, raw, `${opcode} was expanded into primitive instructions.`))
        return
      }
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [left, right],
          category: "quantum",
        }),
      )
      return
    }

    if (opcode === "TOFFOLI") {
      if (restTokens.length !== 3) {
        errors.push(makeIssue(lineNumber, raw, "TOFFOLI requires exactly three qubits."))
        return
      }
      const [controlA, controlB, target] = restTokens
      if (!validateQubit(controlA) || !validateQubit(controlB) || !validateQubit(target)) {
        errors.push(makeIssue(lineNumber, raw, "TOFFOLI requires qubits like q0 q1 q2."))
        return
      }
      qubits.add(controlA)
      qubits.add(controlB)
      qubits.add(target)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [controlA, controlB, target],
          category: "quantum",
        }),
      )
      return
    }

    if (opcode === "MEASURE") {
      if (restTokens.length < 1) {
        errors.push(makeIssue(lineNumber, raw, "MEASURE requires at least one qubit argument."))
        return
      }
      const [qubit, ...basisTokens] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, "MEASURE requires a valid qubit like q0 or q1."))
        return
      }
      const parsedBasis = parseMeasureBasis(basisTokens)
      if (basisTokens.length > 0 && !parsedBasis.basis) {
        errors.push(makeIssue(lineNumber, raw, "MEASURE BASIS must be X or Z."))
        return
      }
      if (basisTokens.length > parsedBasis.consumed) {
        warnings.push(makeIssue(lineNumber, raw, "Extra MEASURE tokens were ignored."))
      }
      qubits.add(qubit)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          basis: parsedBasis.basis ?? "Z",
          category: "quantum",
        }),
      )
      return
    }

    if (opcode === "ASSIGN") {
      if (restTokens.length !== 2) {
        errors.push(makeIssue(lineNumber, raw, "ASSIGN requires a qubit and an actor name."))
        return
      }
      const [qubit, actor] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, "ASSIGN requires a valid qubit like q0 or q1."))
        return
      }
      if (!validateActor(actor)) {
        errors.push(makeIssue(lineNumber, raw, "ASSIGN requires a valid actor name."))
        return
      }
      qubits.add(qubit)
      actors.add(actor)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          actors: [actor],
          category: "actor",
        }),
      )
      return
    }

    if (opcode === "SEND") {
      if (restTokens.length !== 3) {
        errors.push(makeIssue(lineNumber, raw, "SEND requires a qubit, a source actor, and a target actor."))
        return
      }
      const [qubit, fromActor, toActor] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, "SEND requires a valid qubit like q0 or q1."))
        return
      }
      if (!validateActor(fromActor) || !validateActor(toActor)) {
        errors.push(makeIssue(lineNumber, raw, "SEND requires valid actor names."))
        return
      }
      qubits.add(qubit)
      actors.add(fromActor)
      actors.add(toActor)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          actors: [fromActor, toActor],
          category: "transport",
        }),
      )
      return
    }

    if (opcode === "INTERCEPT") {
      if (restTokens.length !== 2) {
        errors.push(makeIssue(lineNumber, raw, "INTERCEPT requires a qubit and an actor name."))
        return
      }
      const [qubit, actor] = restTokens
      if (!validateQubit(qubit)) {
        errors.push(makeIssue(lineNumber, raw, "INTERCEPT requires a valid qubit like q0 or q1."))
        return
      }
      if (!validateActor(actor)) {
        errors.push(makeIssue(lineNumber, raw, "INTERCEPT requires a valid actor name."))
        return
      }
      qubits.add(qubit)
      actors.add(actor)
      instructions.push(
        makeInstruction({
          line: lineNumber,
          raw,
          opcode,
          args: restTokens,
          qubits: [qubit],
          actors: [actor],
          category: "transport",
        }),
      )
      return
    }

    errors.push(makeIssue(lineNumber, raw, `Invalid command "${commandToken}".`))
  })

  return {
    instructions,
    errors,
    warnings,
    qubits: Array.from(qubits).sort(),
    actors: Array.from(actors).sort(),
  }
}
