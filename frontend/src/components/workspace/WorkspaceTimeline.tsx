import type { CSSProperties } from "react"

import type { WorkspaceExecutionState, WorkspaceInstruction } from "@/lib/workspace/types"

export function WorkspaceTimeline({
  instructions,
  activeStep,
  state,
  qubits,
}: {
  instructions: WorkspaceInstruction[]
  activeStep: number
  state: WorkspaceExecutionState | null
  qubits: string[]
}) {
  if (!instructions.length) {
    return <div style={emptyBoxStyle}>Write valid pseudo instructions to generate the circuit timeline.</div>
  }

  const rows = qubits.length > 0 ? qubits : state?.qubits.map((item) => item.id) ?? []
  const stateMap = new Map(state?.qubits.map((item) => [item.id, item]) ?? [])

  return (
    <div style={{ overflow: "auto", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
      <div style={{ minWidth: 760 }}>
        <div style={{ display: "grid", gridTemplateColumns: `220px repeat(${instructions.length}, minmax(120px, 1fr))`, background: "var(--bg-elevated)" }}>
          <div style={timelineHeaderCellStyle}>Qubit / State</div>
          {instructions.map((instruction, index) => (
            <div
              key={`header-${index}`}
              style={{
                ...timelineHeaderCellStyle,
                background: activeStep === index ? "var(--bg-active)" : "var(--bg-elevated)",
                color: activeStep === index ? "var(--accent-cyan)" : "var(--text-primary)",
              }}
            >
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", marginBottom: 6 }}>step {index + 1}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{instruction.opcode}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.45 }}>{instruction.raw}</div>
            </div>
          ))}
        </div>

        {rows.map((qubit) => {
          const qubitState = stateMap.get(qubit)
          return (
            <div key={qubit} style={{ display: "grid", gridTemplateColumns: `220px repeat(${instructions.length}, minmax(120px, 1fr))` }}>
              <div style={timelineRowLabelStyle}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{qubit}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  <div>state {qubitState?.state_label ?? "?"}</div>
                  <div>{qubitState?.owner ? `owner ${qubitState.owner}` : "unassigned"}</div>
                </div>
              </div>
              {instructions.map((instruction, index) => (
                <TimelineCell
                  key={`${qubit}-${index}`}
                  instruction={instruction}
                  qubit={qubit}
                  active={index === activeStep}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimelineCell({
  instruction,
  qubit,
  active,
}: {
  instruction: WorkspaceInstruction
  qubit: string
  active: boolean
}) {
  const touchesQubit = instruction.qubits.includes(qubit)
  let label = ""
  let tone = "var(--border)"

  if (touchesQubit) {
    if (instruction.opcode === "CNOT") {
      label = instruction.qubits[0] === qubit ? "CTRL" : "TARGET"
      tone = "var(--accent-cyan)"
    } else if (instruction.opcode === "SEND") {
      label = `${instruction.actors[0]} -> ${instruction.actors[1]}`
      tone = "var(--accent-blue)"
    } else if (instruction.opcode === "INTERCEPT") {
      label = `INT ${instruction.actors[0]}`
      tone = "var(--accent-red)"
    } else if (instruction.opcode === "ASSIGN") {
      label = instruction.actors[0]
      tone = "var(--accent-amber)"
    } else if (instruction.opcode === "MEASURE") {
      label = `M ${instruction.basis ?? "Z"}`
      tone = "var(--accent-green)"
    } else if (instruction.opcode === "INIT") {
      label = `INIT ${instruction.metadata.state ?? "0"}`
      tone = "var(--accent-amber)"
    } else {
      label = instruction.opcode
      tone = "var(--accent-cyan)"
    }
  }

  return (
    <div
      style={{
        minHeight: 84,
        padding: 10,
        borderLeft: "1px solid var(--border)",
        borderTop: "1px solid var(--border)",
        background: active ? "var(--bg-active)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {touchesQubit ? (
        <div
          style={{
            borderRadius: "var(--radius-md)",
            border: `1px solid ${tone}`,
            color: tone,
            padding: "8px 10px",
            minWidth: 86,
            textAlign: "center",
            background: "var(--bg-elevated)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          {label}
        </div>
      ) : (
        <div style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
          {instruction.category === "annotation" ? instruction.opcode : ""}
        </div>
      )}
    </div>
  )
}

const timelineHeaderCellStyle: CSSProperties = {
  padding: 12,
  borderLeft: "1px solid var(--border)",
  borderBottom: "1px solid var(--border)",
}

const timelineRowLabelStyle: CSSProperties = {
  padding: 12,
  borderTop: "1px solid var(--border)",
  background: "var(--bg-elevated)",
}

const emptyBoxStyle: CSSProperties = {
  minHeight: 220,
  display: "grid",
  placeItems: "center",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
}
