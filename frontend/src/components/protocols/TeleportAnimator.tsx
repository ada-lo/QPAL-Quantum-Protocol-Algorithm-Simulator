
import { useState } from "react"

interface Step {
  label: string
  party: "alice" | "bob" | "both"
  desc: string
  circuit: string[][]  // rows of cells per qubit
  highlight: number    // column to highlight
}

const STEPS: Step[] = [
  {
    label: "Setup",
    party: "both",
    desc: "Alice holds qubit |ψ⟩ = α|0⟩ + β|1⟩. Alice and Bob share a Bell pair |Φ+⟩ — an entangled qubit each. Three qubits total.",
    circuit: [
      ["|ψ⟩", "·", "·", "·", "·"],
      ["|0⟩", "H", "·", "·", "·"],
      ["|0⟩", "·", "CNOT↑", "·", "·"],
    ],
    highlight: -1,
  },
  {
    label: "Entangle Bell",
    party: "both",
    desc: "A Bell pair is created: H on qubit 1, then CNOT with qubit 2 as target. Now q1 and q2 are maximally entangled: (|00⟩+|11⟩)/√2.",
    circuit: [
      ["|ψ⟩", "·", "·", "·", "·"],
      ["|0⟩", "H", "·", "·", "·"],
      ["|0⟩", "·", "CNOT↑", "·", "·"],
    ],
    highlight: 1,
  },
  {
    label: "Alice CNOT",
    party: "alice",
    desc: "Alice applies CNOT: |ψ⟩ is the control, her Bell qubit (q1) is the target. This entangles |ψ⟩ with the Bell pair.",
    circuit: [
      ["|ψ⟩", "·", "CNOT↓", "·", "·"],
      ["|0⟩", "H", "·", "CNOT↑", "·"],
      ["|0⟩", "·", "CNOT↑", "·", "·"],
    ],
    highlight: 2,
  },
  {
    label: "Alice Hadamard",
    party: "alice",
    desc: "Alice applies H to |ψ⟩. The three-qubit state is now a superposition of all four Bell states, each correlated with a correction Bob must apply.",
    circuit: [
      ["|ψ⟩", "·", "CNOT↓", "H", "M→m1"],
      ["|0⟩", "H", "·", "CNOT↑", "M→m2"],
      ["|0⟩", "·", "CNOT↑", "·", "·"],
    ],
    highlight: 3,
  },
  {
    label: "Measure",
    party: "alice",
    desc: "Alice measures both her qubits, getting classical bits m1 and m2. The original |ψ⟩ is destroyed — but its information is now encoded in m1,m2 and Bob's entangled qubit.",
    circuit: [
      ["|ψ⟩", "·", "CNOT↓", "H", "M→m1"],
      ["|0⟩", "H", "·", "CNOT↑", "M→m2"],
      ["|0⟩", "·", "CNOT↑", "·", "·"],
    ],
    highlight: 4,
  },
  {
    label: "Classical bits",
    party: "both",
    desc: "Alice sends m1 and m2 to Bob over a classical channel (phone call, email — anything). This is why teleportation is not faster than light: it needs classical communication.",
    circuit: [
      ["·", "──m1──", "──→──", "──→──", "Bob"],
      ["·", "──m2──", "──→──", "──→──", "Bob"],
      ["|0⟩", "·", "·", "·", "waiting"],
    ],
    highlight: 2,
  },
  {
    label: "Bob corrects",
    party: "bob",
    desc: "Bob applies X^m2 then Z^m1 to his qubit. After these corrections, his qubit is exactly |ψ⟩ = α|0⟩ + β|1⟩. Teleportation complete.",
    circuit: [
      ["·", "·", "·", "·", "·"],
      ["·", "·", "·", "·", "·"],
      ["|0⟩", "·", "X^m2", "Z^m1", "|ψ⟩ ✓"],
    ],
    highlight: 3,
  },
]

const GATE_COLORS: Record<string, string> = {
  "H":     "var(--gate-h)",
  "CNOT↓": "var(--gate-cnot)",
  "CNOT↑": "var(--gate-cnot)",
  "M→m1":  "var(--accent-amber)",
  "M→m2":  "var(--accent-amber)",
  "X^m2":  "var(--gate-x)",
  "Z^m1":  "var(--gate-z)",
  "|ψ⟩ ✓": "var(--accent-green)",
}

export function TeleportAnimator() {
  const [step, setStep] = useState(0)
  const s = STEPS[step]

  const qubitLabels = ["q0 (|ψ⟩)", "q1 Alice", "q2 Bob"]
  const partyColor = {
    alice: "var(--accent-blue)",
    bob:   "var(--accent-purple)",
    both:  "var(--accent-cyan)",
  }[s.party]

  return (
    <div style={{ padding: 24, maxWidth: 700, height: "100%", overflow: "auto" }}>
      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Quantum Teleportation</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>
        Transfer an unknown qubit state from Alice to Bob using one Bell pair and two classical bits.
        No quantum channel is used for the teleported state itself.
      </p>

      {/* Step pills */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {STEPS.map((st, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 500,
            background: i === step ? partyColor : "var(--bg-card)",
            color: i === step ? (s.party === "both" ? "#000" : "#fff") : "var(--text-secondary)",
            border: `1px solid ${i === step ? partyColor : "var(--border)"}`,
            transition: "all var(--transition)",
          }}>{st.label}</button>
        ))}
      </div>

      {/* Description */}
      <div style={{
        padding: "12px 16px", marginBottom: 20,
        background: "var(--bg-card)", borderRadius: "var(--radius-lg)",
        border: `1px solid ${partyColor}33`,
      }}>
        <div style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color: partyColor,
          marginBottom: 6, textTransform: "uppercase",
        }}>
          {s.party === "both" ? "Alice & Bob" : s.party}  —  {s.label}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.7, margin: 0 }}>
          {s.desc}
        </p>
      </div>

      {/* Circuit */}
      <div style={{
        background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)", padding: "16px 16px 12px", marginBottom: 20,
        overflowX: "auto",
      }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
          CIRCUIT
        </div>
        {s.circuit.map((row, qi) => (
          <div key={qi} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <span style={{
              width: 80, fontSize: 11, fontFamily: "var(--font-mono)",
              color: "var(--text-muted)", textAlign: "right", flexShrink: 0,
            }}>
              {qubitLabels[qi]}
            </span>
            <div style={{ height: 1, width: 8, background: "var(--border-bright)", flexShrink: 0 }}/>
            {row.map((cell, ci) => {
              const isHL = ci === s.highlight
              const cellColor = GATE_COLORS[cell]
              const isEmpty = cell === "·" || cell === ""
              return (
                <div key={ci} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    minWidth: 52, height: 28, borderRadius: "var(--radius-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                    background: isEmpty ? "transparent" : isHL ? `${cellColor ?? "var(--accent-cyan)"}22` : "var(--bg-card)",
                    border: isEmpty ? "none" : `1px solid ${cellColor ?? "var(--border)"}`,
                    color: cellColor ?? "var(--text-secondary)",
                    boxShadow: isHL && !isEmpty ? `0 0 8px ${cellColor ?? "var(--accent-cyan)"}44` : "none",
                    transition: "all 0.2s",
                    padding: "0 6px",
                  }}>
                    {isEmpty ? "·" : cell}
                  </div>
                  {ci < row.length - 1 && (
                    <div style={{ height: 1, width: 6, background: "var(--border-bright)" }}/>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Nav buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
          padding: "7px 18px", borderRadius: "var(--radius-md)", fontSize: 13,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: step === 0 ? "var(--text-muted)" : "var(--text-primary)",
        }}>← Back</button>
        <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1} style={{
          padding: "7px 18px", borderRadius: "var(--radius-md)", fontSize: 13,
          background: step === STEPS.length - 1 ? "var(--bg-card)" : "var(--accent-cyan)",
          color: step === STEPS.length - 1 ? "var(--text-muted)" : "#000",
          fontWeight: 600, border: "none",
        }}>Next →</button>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center", fontFamily: "var(--font-mono)" }}>
          {step + 1}/{STEPS.length}
        </span>
      </div>
    </div>
  )
}
