
import { useState, useEffect, useRef } from "react"
import { PartyLayout } from "./PartyLayout"
import { PartyLabel } from "./PartyLabel"
import { QuantumChannel, ClassicalChannel } from "./ChannelAnimation"
import { NoiseOverlay } from "./NoiseOverlay"

/* ── Types ── */
type Basis = "+" | "x"
type Bit   = 0 | 1
type Phase = "idle" | "alice" | "eve" | "bob" | "sift" | "done"

interface QBit {
  bit: Bit; aliceBasis: Basis; bobBasis: Basis
  eveBasis: Basis; eveMeasured: Bit; bobResult: Bit
  match: boolean; eveDistorted: boolean
}

/* ── Helpers ── */
function rbit(): Bit    { return Math.random() > 0.5 ? 1 : 0 }
function rbasis(): Basis { return Math.random() > 0.5 ? "+" : "x" }
function encode(bit: Bit, basis: Basis) { return `${basis}${bit}` }
function measure(state: string, basis: Basis): Bit {
  if (state[0] === basis) return parseInt(state[1]) as Bit
  return rbit()
}

const SYMBOL: Record<string, string> = { "+0": "↑", "+1": "→", "x0": "↗", "x1": "↘" }
const SYMBOL_COLOR: Record<string, string> = {
  "+0": "var(--accent-blue)", "+1": "var(--accent-cyan)",
  "x0": "var(--accent-purple)", "x1": "var(--accent-pink)",
}

const N = 12

function generateQBits(evePresent: boolean): QBit[] {
  return Array.from({ length: N }, () => {
    const bit = rbit(), ab = rbasis(), bb = rbasis(), eb = rbasis()
    let state = encode(bit, ab)
    const eveMeasured = measure(state, eb)
    if (evePresent) state = encode(eveMeasured, eb)
    const bobResult = measure(state, bb)
    return {
      bit, aliceBasis: ab, bobBasis: bb, eveBasis: eb,
      eveMeasured, bobResult,
      match: ab === bb,
      eveDistorted: evePresent && eb !== ab,
    }
  })
}

/* ── Phase config ── */
const PHASE_CONFIG: Record<Phase, {
  label: string; explanation: string; num: number; color: string
}> = {
  idle:  { label: "READY", explanation: "Press Start to begin BB84 key distribution.", num: 0, color: "var(--text-muted)" },
  alice: { label: "ALICE ENCODES", explanation: "Alice randomly chooses a bit and a basis for each qubit, then sends the encoded photon through the quantum channel.", num: 1, color: "var(--accent-blue)" },
  eve:   { label: "EVE INTERCEPTS", explanation: "Eve intercepts each photon, measures in a random basis (disturbing the state), then re-encodes and forwards to Bob.", num: 2, color: "var(--accent-red)" },
  bob:   { label: "BOB MEASURES", explanation: "Bob measures each received photon in a randomly chosen basis. If his basis matches Alice's, he gets the correct bit.", num: 3, color: "var(--accent-purple)" },
  sift:  { label: "BASIS SIFTING", explanation: "Alice and Bob publicly compare bases over a classical channel. They keep only the bits where they chose the same basis.", num: 4, color: "var(--accent-amber)" },
  done:  { label: "KEY EXTRACTED", explanation: "The shared secret key is extracted. If Eve was present, the QBER reveals her interference.", num: 5, color: "var(--accent-green)" },
}

/* ── Main component ── */
export function BB84Animator() {
  const [evePresent, setEvePresent] = useState(false)
  const [phase, setPhase]           = useState<Phase>("idle")
  const [qbits, setQbits]           = useState<QBit[]>([])
  const [revealed, setRevealed]     = useState(0)
  const [autoPlay, setAutoPlay]     = useState(false)
  const [selectedQ, setSelectedQ]   = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  function clear() {
    clearTimeout(timerRef.current); setPhase("idle"); setQbits([]); setRevealed(0)
    setAutoPlay(false); setSelectedQ(null)
  }
  function start() {
    clear(); setQbits(generateQBits(evePresent)); setPhase("alice"); setRevealed(0)
  }

  // Phase sequence
  const phaseOrder: Phase[] = evePresent
    ? ["idle", "alice", "eve", "bob", "sift", "done"]
    : ["idle", "alice", "bob", "sift", "done"]

  function nextPhase() {
    const i = phaseOrder.indexOf(phase)
    if (i < phaseOrder.length - 1) { setPhase(phaseOrder[i + 1]); setRevealed(0) }
  }
  function prevPhase() {
    const i = phaseOrder.indexOf(phase)
    if (i > 1) { setPhase(phaseOrder[i - 1]); setRevealed(0) }
  }

  // Cascade reveal animation
  useEffect(() => {
    if (phase === "idle" || phase === "sift" || phase === "done") return
    if (revealed < N) {
      timerRef.current = setTimeout(() => setRevealed(r => r + 1), 70)
    }
    return () => clearTimeout(timerRef.current)
  }, [phase, revealed])

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return
    if (revealed >= N || phase === "sift" || phase === "done") {
      timerRef.current = setTimeout(nextPhase, 1200)
    }
    return () => clearTimeout(timerRef.current)
  }, [autoPlay, revealed, phase])

  const cfg = PHASE_CONFIG[phase]
  const keyBits = qbits.filter(q => q.match)
  const wrongBits = qbits.filter(q => q.match && q.bobResult !== q.bit)
  const qber = keyBits.length > 0 ? wrongBits.length / keyBits.length : 0
  const eveDetected = qber > 0.11

  // Shared qubit table renderer
  function QubitTable({ showBit, showBasis, showResult, perspective }: {
    showBit?: boolean; showBasis?: boolean; showResult?: boolean
    perspective: "alice" | "bob" | "eve"
  }) {
    return (
      <div style={{ padding: "8px 10px" }}>
        {qbits.map((q, i) => {
          const visible = i < revealed || phase === "sift" || phase === "done"
          const faded = phase === "sift" && !q.match
          const isKey = phase === "done" && q.match
          const selected = selectedQ === i

          let bit = "", basis = "", sym = "", symColor = ""
          if (perspective === "alice") {
            bit = String(q.bit); basis = q.aliceBasis
            sym = SYMBOL[`${q.aliceBasis}${q.bit}`]; symColor = SYMBOL_COLOR[`${q.aliceBasis}${q.bit}`]
          } else if (perspective === "bob") {
            bit = String(q.bobResult); basis = q.bobBasis
            sym = SYMBOL[`${q.bobBasis}${q.bobResult}`]; symColor = SYMBOL_COLOR[`${q.bobBasis}${q.bobResult}`]
          } else {
            bit = String(q.eveMeasured); basis = q.eveBasis
            sym = SYMBOL[`${q.eveBasis}${q.eveMeasured}`]; symColor = q.eveDistorted ? "var(--accent-red)" : "var(--text-muted)"
          }

          return (
            <div key={i} onClick={() => setSelectedQ(i)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 6px", borderRadius: "var(--radius-sm)",
              cursor: "pointer", transition: "all 0.15s",
              opacity: !visible ? 0 : faded ? 0.3 : 1,
              background: selected ? "var(--bg-hover)" : isKey ? "rgba(0,212,255,0.06)" : "transparent",
              border: selected ? "1px solid var(--accent-cyan)" : "1px solid transparent",
              marginBottom: 2,
            }}>
              <span style={{
                fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
                width: 16, textAlign: "right",
              }}>
                {i}
              </span>
              {showBasis && (
                <span style={{
                  fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: "var(--text-secondary)", width: 14,
                }}>
                  {basis}
                </span>
              )}
              {showBit && (
                <span style={{
                  fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 800,
                  color: symColor, width: 16,
                }}>
                  {sym}
                </span>
              )}
              {showResult && phase === "done" && q.match && (
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: q.bobResult === q.bit ? "var(--accent-green)" : "var(--accent-red)",
                }}>
                  {q.bobResult === q.bit ? "✓" : "✗"}
                </span>
              )}
              {phase === "sift" && (
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: q.match ? "var(--accent-green)" : "var(--text-muted)",
                  marginLeft: "auto",
                }}>
                  {q.match ? "KEY" : "—"}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // === ALICE ZONE ===
  const aliceContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="alice" subtitle="Sender"
        status={phase === "alice" ? "ENCODING" : phase === "done" ? "DONE" : undefined}
        statusColor={phase === "alice" ? "var(--accent-blue)" : "var(--accent-green)"} />
      {phase === "idle" ? (
        <div style={{ padding: 14, color: "var(--text-muted)", fontSize: 12, lineHeight: 1.6 }}>
          Ready. Alice will encode {N} random bits in random polarization bases.
        </div>
      ) : (
        <QubitTable showBit showBasis perspective="alice" />
      )}
    </div>
  )

  // === CHANNEL ZONE ===
  const channelContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <QuantumChannel
        sending={phase === "alice" || phase === "eve"}
        label="quantum channel"
        color={evePresent && phase === "eve" ? "var(--accent-red)" : "var(--accent-cyan)"}
      />
      <ClassicalChannel
        sending={phase === "sift"}
        bits={phase === "sift" ? qbits.map(q => q.aliceBasis).join("") : ""}
        label="classical channel"
      />
    </div>
  )

  // === EVE ZONE ===
  const eveContent = evePresent && (phase === "eve" || phase === "bob" || phase === "sift" || phase === "done") ? (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="eve" subtitle="Eavesdropper"
        status={phase === "eve" ? "INTERCEPTING" : "LISTENING"}
        statusColor="var(--accent-red)" />
      <QubitTable showBit showBasis perspective="eve" />
    </div>
  ) : undefined

  // === BOB ZONE ===
  const bobContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="bob" subtitle="Receiver"
        status={phase === "bob" ? "MEASURING" : phase === "done" ? "DONE" : phase === "idle" ? undefined : "WAITING"}
        statusColor={phase === "bob" ? "var(--accent-purple)" : phase === "done" ? "var(--accent-green)" : "var(--text-muted)"} />
      {phase === "idle" ? (
        <div style={{ padding: 14, color: "var(--text-muted)", fontSize: 12, lineHeight: 1.6 }}>
          Waiting for Alice to send photons.
        </div>
      ) : (phase === "alice" || phase === "eve") ? (
        <div style={{ padding: 14, color: "var(--text-muted)", fontSize: 12 }}>
          Receiving photons...
        </div>
      ) : (
        <QubitTable showBit showBasis showResult perspective="bob" />
      )}
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Controls bar */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", padding: "10px 16px",
        borderBottom: "1px solid var(--border)", flexShrink: 0, flexWrap: "wrap",
      }}>
        <button onClick={phase === "idle" ? start : clear} style={{
          padding: "6px 16px", fontWeight: 700, fontSize: 12,
          background: phase === "idle" ? "var(--accent-cyan)" : "var(--bg-card)",
          color: phase === "idle" ? "#000" : "var(--text-primary)",
          borderRadius: "var(--radius-md)", border: phase === "idle" ? "none" : "1px solid var(--border)",
          cursor: "pointer",
        }}>
          {phase === "idle" ? "▶ Start" : "↺ Reset"}
        </button>

        {phase !== "idle" && phase !== "done" && (
          <>
            <button onClick={prevPhase} disabled={phaseOrder.indexOf(phase) <= 1} style={{
              padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius-md)",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              color: phaseOrder.indexOf(phase) <= 1 ? "var(--text-muted)" : "var(--text-primary)",
              cursor: "pointer",
            }}>← Back</button>
            <button onClick={nextPhase} style={{
              padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius-md)",
              background: "var(--accent-cyan)", color: "#000", fontWeight: 600,
              border: "none", cursor: "pointer",
            }}>Next →</button>
            <button onClick={() => setAutoPlay(!autoPlay)} style={{
              padding: "6px 12px", fontSize: 11, borderRadius: "var(--radius-md)",
              background: autoPlay ? "var(--accent-amber)" : "var(--bg-card)",
              color: autoPlay ? "#000" : "var(--text-secondary)",
              border: autoPlay ? "none" : "1px solid var(--border)",
              cursor: "pointer", fontWeight: autoPlay ? 700 : 400,
            }}>
              {autoPlay ? "⏸ Pause" : "▶ Auto"}
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Eve toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
          <div onClick={() => { setEvePresent(v => !v); if (phase !== "idle") clear() }} style={{
            width: 36, height: 20, borderRadius: 10,
            background: evePresent ? "var(--accent-red)" : "var(--bg-hover)",
            border: `1px solid ${evePresent ? "var(--accent-red)" : "var(--border)"}`,
            position: "relative", transition: "all 0.2s", cursor: "pointer",
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2,
              left: evePresent ? 18 : 2, transition: "left 0.2s",
            }}/>
          </div>
          <span style={{ color: evePresent ? "var(--accent-red)" : "var(--text-secondary)" }}>
            {evePresent ? "Eve ⚠" : "No Eve"}
          </span>
        </label>
      </div>

      {/* Party layout */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <PartyLayout
          phaseBanner={cfg.label}
          phaseNum={cfg.num}
          explanation={cfg.explanation}
          bannerColor={cfg.color}
          alice={aliceContent}
          channel={channelContent}
          eve={eveContent}
          bob={bobContent}
        />
      </div>

      {/* Results bar (done phase) */}
      {phase === "done" && (
        <div style={{
          padding: "12px 16px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", flexShrink: 0,
        }}>
          {/* Key length */}
          <div style={{
            padding: "6px 12px", background: "var(--bg-card)",
            borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>KEY LENGTH</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
              {keyBits.length} / {N}
            </div>
          </div>

          {/* QBER */}
          <div style={{
            padding: "6px 12px", background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${eveDetected ? "var(--accent-red)" : "var(--border)"}`,
            minWidth: 100,
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>QBER</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)",
                color: qber > 0.25 ? "var(--accent-red)" : qber > 0.11 ? "var(--accent-amber)" : "var(--accent-green)",
              }}>
                {(qber * 100).toFixed(1)}%
              </div>
              {/* Mini QBER bar */}
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--bg-hover)", minWidth: 60, position: "relative" }}>
                {/* Threshold marks */}
                <div style={{ position: "absolute", left: "22%", top: -2, bottom: -2, width: 1, background: "var(--accent-amber)" }} />
                <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "var(--accent-red)" }} />
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${Math.min(100, qber * 200)}%`,
                  background: qber > 0.25 ? "var(--accent-red)" : qber > 0.11 ? "var(--accent-amber)" : "var(--accent-green)",
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          </div>

          {/* Shared key */}
          <div style={{
            padding: "6px 12px", background: "var(--bg-card)",
            borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SHARED KEY</div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "var(--accent-cyan)",
              fontFamily: "var(--font-mono)", letterSpacing: 1,
            }}>
              {keyBits.map(q => q.bit).join("")}
            </div>
          </div>

          {/* Eve status */}
          {evePresent && (
            <div style={{
              padding: "6px 14px", borderRadius: "var(--radius-md)",
              background: eveDetected ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
              border: `2px solid ${eveDetected ? "var(--accent-red)" : "var(--accent-green)"}`,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 800,
                color: eveDetected ? "var(--accent-red)" : "var(--accent-green)",
              }}>
                {eveDetected ? "🚨 EVE DETECTED — ABORT" : "✓ Undetected"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>
                {eveDetected ? "QBER exceeds 11% threshold" : "QBER within safe bounds"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Noise overlay */}
      <NoiseOverlay />
    </div>
  )
}
