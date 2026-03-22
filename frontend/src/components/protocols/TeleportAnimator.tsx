
import { useState } from "react"
import { PartyLayout } from "./PartyLayout"
import { PartyLabel } from "./PartyLabel"
import { QuantumChannel, ClassicalChannel, EntangledChannel } from "./ChannelAnimation"
import { NoiseOverlay } from "./NoiseOverlay"

type Phase = "setup" | "entangle" | "measure" | "classical" | "correct"

const PHASES: {
  id: Phase; label: string; explanation: string; num: number; color: string
}[] = [
  { id: "setup",     label: "SETUP",                num: 0, color: "var(--accent-cyan)",   explanation: "Alice holds |ψ⟩ = α|0⟩ + β|1⟩. A Bell pair |Φ+⟩ is created — Alice and Bob each get one qubit." },
  { id: "entangle",  label: "ALICE ENTANGLES",      num: 1, color: "var(--accent-blue)",   explanation: "Alice applies CNOT (|ψ⟩ as control, her Bell qubit as target), then Hadamard on |ψ⟩. This spreads the state across all three qubits." },
  { id: "measure",   label: "ALICE MEASURES",       num: 2, color: "var(--accent-amber)",  explanation: "Alice measures both her qubits, collapsing them to classical bits m₁ and m₂. The original |ψ⟩ is destroyed — but its information is encoded in the entanglement." },
  { id: "classical", label: "CLASSICAL SEND",       num: 3, color: "var(--accent-amber)",  explanation: "Alice sends m₁ and m₂ to Bob over a classical channel. This is why teleportation cannot be faster than light." },
  { id: "correct",   label: "BOB CORRECTS → |ψ⟩",  num: 4, color: "var(--accent-green)",  explanation: "Bob applies X^m₂ then Z^m₁ to his qubit. After correction, his qubit is exactly |ψ⟩. Teleportation complete." },
]

export function TeleportAnimator() {
  const [step, setStep]   = useState(0)
  const [alpha, setAlpha] = useState(0.6)
  const beta = Math.sqrt(1 - alpha * alpha)

  const p = PHASES[step]

  // Random measurement outcomes (fixed per session for consistency)
  const [m1] = useState(() => Math.random() > 0.5 ? 1 : 0)
  const [m2] = useState(() => Math.random() > 0.5 ? 1 : 0)

  // === ALICE ZONE ===
  const aliceContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="alice" subtitle="Sender"
        status={step <= 2 ? "ACTIVE" : "DONE"}
        statusColor={step <= 2 ? "var(--accent-blue)" : "var(--accent-green)"} />
      <div style={{ padding: 14 }}>
        {/* Initial state */}
        <div style={{
          padding: "10px 12px", borderRadius: "var(--radius-md)",
          background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: 10,
          opacity: step >= 3 ? 0.4 : 1, transition: "opacity 0.3s",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
            {step < 2 ? "ALICE'S QUBIT |ψ⟩" : "ORIGINAL STATE (destroyed)"}
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)",
            color: step < 2 ? "var(--accent-cyan)" : "var(--text-muted)",
          }}>
            {alpha.toFixed(2)}|0⟩ + {beta.toFixed(2)}|1⟩
          </div>
          {step >= 2 && (
            <div style={{
              marginTop: 4, fontSize: 10, color: "var(--accent-red)",
              fontStyle: "italic",
            }}>
              ✗ Collapsed — no-cloning theorem
            </div>
          )}
        </div>

        {/* Alpha slider */}
        {step === 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>α</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                {alpha.toFixed(2)}
              </span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={alpha}
              onChange={e => setAlpha(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-cyan)" }} />
          </div>
        )}

        {/* Bell qubit */}
        <div style={{
          padding: "8px 10px", borderRadius: "var(--radius-md)",
          background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: 10,
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
            ALICE'S BELL QUBIT (q₁)
          </div>
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent-purple)" }}>
            {step === 0 ? "|0⟩ → H → CNOT" : "entangled with Bob"}
          </div>
        </div>

        {/* Operations */}
        {step === 1 && (
          <div style={{
            display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8,
          }}>
            {["CNOT", "H"].map(g => (
              <div key={g} style={{
                padding: "4px 10px", borderRadius: "var(--radius-sm)",
                background: "rgba(59,130,246,0.12)", border: "1px solid var(--accent-blue)",
                fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-blue)",
              }}>{g}</div>
            ))}
          </div>
        )}

        {/* Measurement results */}
        {step >= 2 && (
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)",
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
              MEASUREMENT RESULTS
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ label: "m₁", val: m1 }, { label: "m₂", val: m2 }].map(({ label, val }) => (
                <div key={label} style={{
                  width: 40, height: 40, borderRadius: "var(--radius-md)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "var(--bg-card)", border: "1px solid var(--accent-amber)",
                }}>
                  <span style={{ fontSize: 8, color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // === CHANNEL ZONE ===
  const channelContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <EntangledChannel
        active={step <= 1}
        label={step <= 1 ? "Bell pair |Φ+⟩" : "collapsed"}
      />
      <ClassicalChannel
        sending={step === 3}
        bits={`m₁=${m1},m₂=${m2}`}
        label="classical channel"
      />
    </div>
  )

  // === BOB ZONE ===
  const bobContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="bob" subtitle="Receiver"
        status={step === 4 ? "|ψ⟩ RECOVERED" : step >= 3 ? "CORRECTING" : "WAITING"}
        statusColor={step === 4 ? "var(--accent-green)" : step >= 3 ? "var(--accent-purple)" : "var(--text-muted)"} />
      <div style={{ padding: 14 }}>
        {/* Bob's Bell qubit */}
        <div style={{
          padding: "10px 12px", borderRadius: "var(--radius-md)",
          background: "var(--bg-card)", border: `1px solid ${step === 4 ? "var(--accent-green)" : "var(--border)"}`,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
            BOB'S QUBIT (q₂)
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)",
            color: step === 4 ? "var(--accent-green)" : "var(--accent-purple)",
          }}>
            {step === 4 ? `${alpha.toFixed(2)}|0⟩ + ${beta.toFixed(2)}|1⟩` :
             step >= 3 ? "applying corrections..." :
             "entangled half of |Φ+⟩"}
          </div>
          {step === 4 && (
            <div style={{ marginTop: 4, fontSize: 10, color: "var(--accent-green)", fontWeight: 700 }}>
              ✓ Matches Alice's original |ψ⟩!
            </div>
          )}
        </div>

        {/* Correction gates */}
        {step >= 3 && (
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
              CORRECTIONS NEEDED
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {m2 === 1 && (
                <span style={{
                  padding: "3px 8px", borderRadius: "var(--radius-sm)",
                  background: "rgba(139,92,246,0.12)", border: "1px solid var(--accent-purple)",
                  fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-purple)",
                }}>X</span>
              )}
              {m1 === 1 && (
                <span style={{
                  padding: "3px 8px", borderRadius: "var(--radius-sm)",
                  background: "rgba(139,92,246,0.12)", border: "1px solid var(--accent-purple)",
                  fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-purple)",
                }}>Z</span>
              )}
              {m1 === 0 && m2 === 0 && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  None needed (lucky!)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Side-by-side comparison at end */}
        {step === 4 && (
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)",
            background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
              VERIFICATION — Alice's original vs Bob's recovered
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Alice (destroyed)", state: `${alpha.toFixed(2)}|0⟩+${beta.toFixed(2)}|1⟩`, color: "var(--text-muted)" },
                { label: "Bob (recovered)", state: `${alpha.toFixed(2)}|0⟩+${beta.toFixed(2)}|1⟩`, color: "var(--accent-green)" },
              ].map(({ label, state, color }) => (
                <div key={label} style={{
                  flex: 1, padding: "6px 8px", borderRadius: "var(--radius-sm)",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 8, color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color }}>{state}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--accent-green)" }}>No-cloning theorem: </strong>
              Alice's original was destroyed during measurement. The state was not copied — it was transferred.
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Step navigation */}
      <div style={{
        display: "flex", gap: 4, padding: "10px 16px", borderBottom: "1px solid var(--border)",
        flexShrink: 0, flexWrap: "wrap", alignItems: "center",
      }}>
        {PHASES.map((ph, i) => (
          <button key={ph.id} onClick={() => setStep(i)} style={{
            padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: i === step ? 700 : 400,
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

      <NoiseOverlay />
    </div>
  )
}
