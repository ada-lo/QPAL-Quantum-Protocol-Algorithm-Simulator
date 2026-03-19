
import { useState, useEffect, useRef, useCallback } from "react"

type Basis = "+" | "x"
type Bit   = 0 | 1

interface QBit {
  bit: Bit
  aliceBasis: Basis
  bobBasis: Basis
  eveBasis: Basis
  eveMeasured: Bit
  bobResult: Bit
  match: boolean
  eveDistorted: boolean
}

function rbit(): Bit    { return Math.random() > 0.5 ? 1 : 0 }
function rbasis(): Basis { return Math.random() > 0.5 ? "+" : "x" }

function encode(bit: Bit, basis: Basis): string {
  return `${basis}${bit}`
}
function measure(state: string, basis: Basis): Bit {
  if (state[0] === basis) return parseInt(state[1]) as Bit
  return rbit()
}

const SYMBOL: Record<string, string> = {
  "+0": "↑", "+1": "→", "x0": "↗", "x1": "↘",
}
const SYMBOL_COLOR: Record<string, string> = {
  "+0": "var(--accent-blue)", "+1": "var(--accent-cyan)",
  "x0": "var(--accent-purple)", "x1": "var(--accent-pink)",
}

const N = 16

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

type Phase = "idle" | "alice" | "channel" | "bob" | "sift" | "done"

export function BB84Animator() {
  const [evePresent, setEvePresent]   = useState(false)
  const [phase, setPhase]             = useState<Phase>("idle")
  const [qbits, setQbits]             = useState<QBit[]>([])
  const [revealed, setRevealed]       = useState(0)   // how many columns visible
  const [animating, setAnimating]     = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  function clear() {
    clearTimeout(timerRef.current)
    setPhase("idle"); setQbits([]); setRevealed(0); setAnimating(false)
  }

  function start() {
    clear()
    const bits = generateQBits(evePresent)
    setQbits(bits)
    setPhase("alice")
    setRevealed(0)
    setAnimating(true)
  }

  // Cascade reveal: each column appears with delay
  useEffect(() => {
    if (!animating || phase === "idle" || phase === "sift" || phase === "done") return
    if (revealed < N) {
      timerRef.current = setTimeout(() => setRevealed(r => r + 1), 80)
    } else {
      // Advance phase
      timerRef.current = setTimeout(() => {
        setPhase(p => {
          if (p === "alice")   return "channel"
          if (p === "channel") return "bob"
          if (p === "bob")     return "sift"
          return p
        })
        setRevealed(0)
      }, 300)
    }
    return () => clearTimeout(timerRef.current)
  }, [animating, phase, revealed])

  // Sift → done
  useEffect(() => {
    if (phase === "sift") {
      timerRef.current = setTimeout(() => setPhase("done"), 600)
    }
  }, [phase])

  const keyBits   = qbits.filter(q => q.match)
  const wrongBits = qbits.filter(q => q.match && q.bobResult !== q.bit)
  const qber      = keyBits.length > 0 ? wrongBits.length / keyBits.length : 0
  const eveDetected = qber > 0.11

  const PHASE_LABELS: Record<Phase, string> = {
    idle:    "Press Start to begin the protocol",
    alice:   "Alice encodes bits in random bases →",
    channel: "Qubits travel through quantum channel →",
    bob:     "Bob measures in random bases →",
    sift:    "Sifting: Alice & Bob announce bases →",
    done:    "Sifting complete — shared key extracted",
  }

  // Columns to show based on phase
  const showAlice   = phase !== "idle"
  const showChannel = phase === "channel" || phase === "bob" || phase === "sift" || phase === "done"
  const showBob     = phase === "bob" || phase === "sift" || phase === "done"
  const showSift    = phase === "sift" || phase === "done"

  return (
    <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>BB84 Quantum Key Distribution</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6, maxWidth: 600 }}>
          Alice sends qubits encoded in two bases (+, ×). Bob measures randomly.
          They keep only bits where bases matched. Any eavesdropper (Eve) introduces detectable errors.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={start} style={{
          padding: "7px 20px", fontWeight: 700, fontSize: 13,
          background: "var(--accent-cyan)", color: "#000", borderRadius: "var(--radius-md)",
        }}>
          {phase === "idle" ? "▶ Start" : "↺ Restart"}
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <div style={{
            width: 36, height: 20, borderRadius: 10,
            background: evePresent ? "var(--accent-red)" : "var(--bg-hover)",
            border: `1px solid ${evePresent ? "var(--accent-red)" : "var(--border)"}`,
            position: "relative", transition: "all 0.2s", cursor: "pointer",
          }} onClick={() => setEvePresent(v => !v)}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2,
              left: evePresent ? 18 : 2, transition: "left 0.2s",
            }}/>
          </div>
          <span style={{ color: evePresent ? "var(--accent-red)" : "var(--text-secondary)" }}>
            {evePresent ? "Eve present ⚠" : "No eavesdropper"}
          </span>
        </label>
      </div>

      {/* Phase label */}
      <div style={{
        padding: "7px 12px", marginBottom: 16,
        background: "var(--bg-card)", borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)", fontSize: 12,
        color: phase === "done" ? "var(--accent-cyan)" : "var(--text-secondary)",
        fontFamily: "var(--font-mono)",
      }}>
        {PHASE_LABELS[phase]}
      </div>

      {qbits.length > 0 && (
        <>
          {/* Party labels */}
          <div style={{
            display: "grid",
            gridTemplateColumns: showSift
              ? "70px repeat(16, 1fr) 70px"
              : "70px repeat(16, 1fr) 70px",
            gap: 0, marginBottom: 4,
          }}>
            <div/>
            {qbits.map((_, i) => (
              <div key={i} style={{
                textAlign: "center", fontSize: 9,
                fontFamily: "var(--font-mono)", color: "var(--text-muted)",
              }}>{i}</div>
            ))}
            <div/>
          </div>

          {/* Row renderer */}
          {[
            { label: "Alice\nbasis", show: showAlice, key: "ab", getter: (q: QBit) => q.aliceBasis, color: "var(--accent-blue)" },
            { label: "Alice\nbit",   show: showAlice, key: "abit", getter: (q: QBit) => String(q.bit), color: "var(--accent-green)" },
            { label: "Photon", show: showChannel, key: "ph", getter: (q: QBit) => SYMBOL[`${q.aliceBasis}${q.bit}`], color: (q: QBit) => SYMBOL_COLOR[`${q.aliceBasis}${q.bit}`] },
            ...(evePresent ? [
              { label: "Eve\nbasis", show: showChannel, key: "eb", getter: (q: QBit) => q.eveBasis, color: "var(--accent-red)" },
              { label: "Eve\nread",  show: showChannel, key: "em", getter: (q: QBit) => String(q.eveMeasured), color: "var(--accent-red)" },
            ] : []),
            { label: "Bob\nbasis",  show: showBob, key: "bb", getter: (q: QBit) => q.bobBasis, color: "var(--accent-purple)" },
            { label: "Bob\nread",   show: showBob, key: "br", getter: (q: QBit) => String(q.bobResult), color: "var(--accent-purple)" },
            { label: "Match?",      show: showSift, key: "match", getter: (q: QBit) => q.match ? "✓" : "✗", color: (q: QBit) => q.match ? "var(--accent-green)" : "var(--text-muted)" },
            { label: "Key bit",     show: showSift && phase === "done", key: "key", getter: (q: QBit) => q.match ? String(q.bit) : "—", color: (q: QBit) => q.match ? "var(--accent-cyan)" : "var(--text-muted)" },
          ].map((row: any) => row.show && (
            <div key={row.key} style={{
              display: "grid",
              gridTemplateColumns: "70px repeat(16, 1fr)",
              gap: 0, marginBottom: 3, alignItems: "center",
            }}>
              <div style={{
                fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
                whiteSpace: "pre-line", lineHeight: 1.3, paddingRight: 6, textAlign: "right",
              }}>{row.label}</div>
              {qbits.map((q, i) => {
                const val = row.getter(q)
                const col = typeof row.color === "function" ? row.color(q) : row.color
                const visible = i < revealed || phase === "sift" || phase === "done"
                return (
                  <div key={i} style={{
                    textAlign: "center", fontSize: 12,
                    fontFamily: "var(--font-mono)", fontWeight: 700,
                    color: visible ? col : "transparent",
                    transition: "color 0.15s",
                    padding: "2px 0",
                    background: row.key === "key" && q.match && phase === "done"
                      ? "rgba(0,212,255,0.08)" : "transparent",
                    borderRadius: 3,
                  }}>
                    {val}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Results */}
          {phase === "done" && (
            <div style={{
              marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap",
            }}>
              {[
                { label: "Key bits",   value: `${keyBits.length} / ${N}`,       color: "var(--accent-cyan)" },
                { label: "QBER",       value: `${(qber * 100).toFixed(1)}%`,    color: qber > 0.11 ? "var(--accent-red)" : "var(--accent-green)" },
                { label: "Key",        value: keyBits.map(q => q.bit).join(""),  color: "var(--accent-cyan)", mono: true },
              ].map(({ label, value, color, mono }) => (
                <div key={label} style={{
                  padding: "8px 14px", background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${label === "QBER" && eveDetected ? "var(--accent-red)" : "var(--border)"}`,
                  minWidth: 100,
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color,
                    fontFamily: mono ? "var(--font-mono)" : "inherit",
                    wordBreak: "break-all",
                  }}>{value}</div>
                </div>
              ))}

              {evePresent && (
                <div style={{
                  padding: "8px 14px", background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${eveDetected ? "var(--accent-red)" : "var(--accent-green)"}`,
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Eve status</div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: eveDetected ? "var(--accent-red)" : "var(--accent-green)",
                  }}>
                    {eveDetected ? "🚨 DETECTED" : "✓ Undetected"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explanation box */}
          {phase === "done" && evePresent && eveDetected && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "rgba(239,68,68,0.06)",
              borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7,
            }}>
              <span style={{ color: "var(--accent-red)", fontWeight: 600 }}>Why detected: </span>
              Eve must measure in a random basis. When she picks the wrong one, she projects the qubit into a different state — causing Bob to get wrong results even when his basis matches Alice's. A QBER above ~11% is statistically impossible without an eavesdropper.
            </div>
          )}
        </>
      )}
    </div>
  )
}
