
import { useState } from "react"
import { PartyLayout } from "./PartyLayout"
import { PartyLabel } from "./PartyLabel"
import { QuantumChannel, EntangledChannel } from "./ChannelAnimation"
import { NoiseOverlay } from "./NoiseOverlay"

type Phase = "bell" | "select" | "encode" | "send" | "decode" | "result"

const BELL_ENC: Record<string, { state: string; ops: string; gates: string[] }> = {
  "00": { state: "|Φ+⟩ = (|00⟩+|11⟩)/√2", ops: "Identity (I)",   gates: [] },
  "01": { state: "|Ψ+⟩ = (|01⟩+|10⟩)/√2", ops: "Pauli-X",        gates: ["X"] },
  "10": { state: "|Φ-⟩ = (|00⟩-|11⟩)/√2", ops: "Pauli-Z",        gates: ["Z"] },
  "11": { state: "|Ψ-⟩ = (|01⟩-|10⟩)/√2", ops: "iY (= ZX)",      gates: ["Z", "X"] },
}

const PHASES: { id: Phase; label: string; num: number; color: string; explanation: string }[] = [
  { id: "bell",   label: "BELL PAIR",       num: 0, color: "var(--accent-purple)", explanation: "Alice and Bob share a Bell pair |Φ+⟩ — each holds one entangled qubit." },
  { id: "select", label: "SELECT MESSAGE",  num: 1, color: "var(--accent-cyan)",   explanation: "Alice chooses the 2 classical bits she wants to send." },
  { id: "encode", label: "ALICE ENCODES",   num: 2, color: "var(--accent-amber)",  explanation: "Alice applies a gate to her qubit based on the bits she wants to send. This encodes 2 bits into 1 qubit." },
  { id: "send",   label: "QUBIT IN FLIGHT", num: 3, color: "var(--accent-cyan)",   explanation: "Alice sends her single qubit to Bob through the quantum channel. Only 1 qubit travels — but it carries 2 bits of information." },
  { id: "decode", label: "BOB DECODES",     num: 4, color: "var(--accent-purple)", explanation: "Bob applies CNOT (Alice's qubit as control, his as target) then Hadamard on Alice's qubit." },
  { id: "result", label: "2 BITS RECEIVED", num: 5, color: "var(--accent-green)",  explanation: "Bob measures both qubits and recovers Alice's 2-bit message. Superdense coding complete!" },
]

export function SuperdenseAnimator() {
  const [step, setStep] = useState(0)
  const [bits, setBits] = useState<[0|1, 0|1]>([0, 0])

  const p = PHASES[step]
  const key = `${bits[0]}${bits[1]}`
  const enc = BELL_ENC[key]

  const toggle = (i: 0|1) => {
    setBits(b => { const nb = [...b] as [0|1,0|1]; nb[i] = (nb[i]^1) as 0|1; return nb })
  }

  // === ALICE ZONE ===
  const aliceContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="alice" subtitle="Sender"
        status={step <= 3 ? "ACTIVE" : "DONE"}
        statusColor={step <= 3 ? "var(--accent-blue)" : "var(--accent-green)"} />
      <div style={{ padding: 14 }}>
        {/* Message selector */}
        <div style={{
          padding: "10px 12px", borderRadius: "var(--radius-md)",
          background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: 10,
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            MESSAGE TO SEND
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {([0, 1] as const).map(i => (
              <button key={i} onClick={() => step <= 1 && toggle(i)} disabled={step > 1} style={{
                width: 44, height: 44, borderRadius: "var(--radius-md)",
                fontSize: 20, fontWeight: 900, fontFamily: "var(--font-mono)",
                background: bits[i] ? "rgba(0,212,255,0.15)" : "rgba(59,130,246,0.10)",
                color: bits[i] ? "var(--accent-cyan)" : "var(--accent-blue)",
                border: `2px solid ${bits[i] ? "var(--accent-cyan)" : "var(--accent-blue)"}`,
                cursor: step <= 1 ? "pointer" : "default", opacity: step <= 1 ? 1 : 0.7,
              }}>{bits[i]}</button>
            ))}
            <span style={{ fontSize: 22, color: "var(--border-bright)" }}>→</span>
            <div style={{
              width: 58, height: 44, borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,212,255,0.08)", border: "2px solid var(--accent-cyan)",
              fontSize: 22, fontWeight: 900, fontFamily: "var(--font-mono)",
              color: "var(--accent-cyan)", letterSpacing: 4,
            }}>{key}</div>
          </div>
        </div>

        {/* Encoding gate */}
        {step >= 2 && (
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)",
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)",
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
              ENCODING GATE
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {enc.gates.length === 0 ? (
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                  I (identity — no gate needed)
                </span>
              ) : enc.gates.map(g => (
                <span key={g} style={{
                  padding: "4px 10px", borderRadius: "var(--radius-sm)",
                  background: "rgba(245,158,11,0.15)", border: "1px solid var(--accent-amber)",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-amber)",
                }}>{g}</span>
              ))}
              <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 4 }}>
                {enc.ops}
              </span>
            </div>
          </div>
        )}

        {/* Alice's qubit */}
        <div style={{
          padding: "8px 10px", borderRadius: "var(--radius-md)",
          background: "var(--bg-card)", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
            ALICE'S QUBIT (q₁)
          </div>
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: step >= 3 ? "var(--text-muted)" : "var(--accent-purple)" }}>
            {step >= 3 ? "sent to Bob →" : step >= 2 ? enc.state : "half of |Φ+⟩"}
          </div>
        </div>
      </div>
    </div>
  )

  // === CHANNEL ZONE ===
  const channelContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <EntangledChannel active={step <= 1} label={step <= 1 ? "Bell pair |Φ+⟩" : "used"} />
      <QuantumChannel
        sending={step === 3}
        label={step === 3 ? "1 qubit → 2 bits!" : "quantum channel"}
        color="var(--accent-cyan)"
      />
      {step === 3 && (
        <div style={{
          textAlign: "center", fontSize: 10, fontWeight: 700,
          color: "var(--accent-green)", fontFamily: "var(--font-mono)",
          padding: "4px 8px", background: "rgba(16,185,129,0.08)",
          borderRadius: "var(--radius-sm)", border: "1px solid rgba(16,185,129,0.2)",
          margin: "0 8px",
        }}>
          ⚡ Only 1 qubit sent!
        </div>
      )}
    </div>
  )

  // === BOB ZONE ===
  const bobContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="bob" subtitle="Receiver"
        status={step === 5 ? `GOT "${key}"` : step >= 4 ? "DECODING" : "WAITING"}
        statusColor={step === 5 ? "var(--accent-green)" : step >= 4 ? "var(--accent-purple)" : "var(--text-muted)"} />
      <div style={{ padding: 14 }}>
        {/* Bob's qubit */}
        <div style={{
          padding: "10px 12px", borderRadius: "var(--radius-md)",
          background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: 10,
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
            BOB'S QUBIT (q₂)
          </div>
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent-purple)" }}>
            half of |Φ+⟩
          </div>
        </div>

        {/* Decode gates */}
        {step >= 4 && (
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)",
            background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.3)",
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
              DECODING CIRCUIT
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["CNOT", "H"].map(g => (
                <span key={g} style={{
                  padding: "4px 10px", borderRadius: "var(--radius-sm)",
                  background: "rgba(139,92,246,0.12)", border: "1px solid var(--accent-purple)",
                  fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-purple)",
                }}>{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {step === 5 && (
          <div style={{
            padding: "12px 14px", borderRadius: "var(--radius-md)",
            background: "rgba(16,185,129,0.06)", border: "2px solid var(--accent-green)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
              MEASUREMENT RESULT
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, fontFamily: "var(--font-mono)",
              color: "var(--accent-green)", textAlign: "center", letterSpacing: 8,
            }}>
              {key}
            </div>
            <div style={{
              marginTop: 8, fontSize: 11, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.6,
            }}>
              <strong style={{ color: "var(--accent-green)" }}>2 classical bits</strong> decoded from{" "}
              <strong style={{ color: "var(--accent-cyan)" }}>1 qubit</strong> — that's superdense coding!
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Step pills */}
      <div style={{
        display: "flex", gap: 4, padding: "10px 16px",
        borderBottom: "1px solid var(--border)", flexShrink: 0, flexWrap: "wrap", alignItems: "center",
      }}>
        {PHASES.map((ph, i) => (
          <button key={ph.id} onClick={() => setStep(i)} style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: i === step ? 700 : 400,
            background: i === step ? ph.color : "var(--bg-card)",
            color: i === step ? "#000" : "var(--text-secondary)",
            border: `1px solid ${i === step ? ph.color : "var(--border)"}`,
            cursor: "pointer", transition: "all 0.2s",
          }}>{ph.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {step + 1}/{PHASES.length}
        </span>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <PartyLayout
          phaseBanner={p.label}
          phaseNum={p.num}
          explanation={p.explanation}
          bannerColor={p.color}
          alice={aliceContent}
          channel={channelContent}
          bob={bobContent}
        />
      </div>

      {/* Encoding table */}
      <div style={{
        padding: "10px 16px", borderTop: "1px solid var(--border)", flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
          ENCODING TABLE
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(BELL_ENC).map(([k, v]) => (
            <div key={k} style={{
              padding: "4px 10px", borderRadius: "var(--radius-sm)",
              background: k === key ? "rgba(0,212,255,0.08)" : "var(--bg-card)",
              border: `1px solid ${k === key ? "var(--accent-cyan)" : "var(--border)"}`,
              fontSize: 10, fontFamily: "var(--font-mono)",
              color: k === key ? "var(--accent-cyan)" : "var(--text-muted)",
              fontWeight: k === key ? 700 : 400,
            }}>
              {k} → {v.ops}
            </div>
          ))}
        </div>
      </div>

      <NoiseOverlay />
    </div>
  )
}
