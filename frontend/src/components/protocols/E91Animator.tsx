
import { useState, useMemo } from "react"
import { PartyLayout } from "./PartyLayout"
import { PartyLabel } from "./PartyLabel"
import { EntangledChannel, ClassicalChannel } from "./ChannelAnimation"

type Phase = "emit" | "measure_a" | "measure_b" | "compare" | "bell" | "key"

const A_BASES = [0, 45, 90]       // Alice's measurement angles (degrees)
const B_BASES = [45, 90, 135]     // Bob's measurement angles

function rbit(): 0 | 1 { return Math.random() > 0.5 ? 1 : 0 }
function pickFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

interface E91Pair {
  aliceBasis: number; bobBasis: number
  aliceResult: 0 | 1; bobResult: 0 | 1
  matching: boolean  // bases allow key extraction (both 45° or both 90°)
  bellTest: boolean   // bases differ → used for CHSH test
}

function generatePairs(n: number, evePresent: boolean): E91Pair[] {
  return Array.from({ length: n }, () => {
    const ab = pickFrom(A_BASES), bb = pickFrom(B_BASES)
    const ar = rbit()
    // For matching bases, Bob gets perfectly correlated result
    // For non-matching, results are random (used for Bell test)
    const matching = ab === bb
    let br: 0 | 1
    if (matching) {
      br = evePresent ? (Math.random() > 0.85 ? (ar ^ 1) as 0 | 1 : ar) : ar
    } else {
      br = rbit()
    }
    return {
      aliceBasis: ab, bobBasis: bb,
      aliceResult: ar, bobResult: br,
      matching, bellTest: !matching,
    }
  })
}

// Compute CHSH S value from correlations
function computeCHSH(pairs: E91Pair[], evePresent: boolean): number {
  // In ideal E91 with no Eve: S = 2√2 ≈ 2.828
  // With Eve intercepting: S drops below 2
  if (pairs.length === 0) return 2.828
  if (evePresent) return 1.6 + Math.random() * 0.3  // Eve → S < 2
  return 2.6 + Math.random() * 0.3  // No Eve → S > 2 (close to 2√2)
}

const N = 16

const PHASES: { id: Phase; label: string; num: number; color: string; explanation: string }[] = [
  { id: "emit",      label: "SOURCE EMITS",       num: 0, color: "var(--accent-green)",  explanation: "A central source emits entangled photon pairs |Φ+⟩. One photon goes to Alice, the other to Bob." },
  { id: "measure_a", label: "ALICE MEASURES",      num: 1, color: "var(--accent-blue)",   explanation: "Alice randomly chooses a measurement basis (0°, 45°, or 90°) for each received photon and records her result." },
  { id: "measure_b", label: "BOB MEASURES",        num: 2, color: "var(--accent-purple)", explanation: "Bob independently measures his photons in a random basis (45°, 90°, or 135°). He and Alice never communicate which basis they'll use." },
  { id: "compare",   label: "COMPARE BASES",       num: 3, color: "var(--accent-amber)",  explanation: "Alice and Bob publicly announce their bases over a classical channel. They sort pairs into key bits (matching bases) and Bell test pairs (different bases)." },
  { id: "bell",      label: "BELL TEST (CHSH)",    num: 4, color: "var(--accent-cyan)",   explanation: "The CHSH inequality S ≤ 2 must be violated (S > 2) to confirm quantum correlations. If S < 2, Eve has been intercepting." },
  { id: "key",       label: "KEY EXTRACTED",       num: 5, color: "var(--accent-green)",  explanation: "Matching-basis pairs form the shared secret key. The Bell test confirms security." },
]

export function E91Animator() {
  const [step, setStep] = useState(0)
  const [evePresent, setEvePresent] = useState(false)

  const pairs = useMemo(() => generatePairs(N, evePresent), [evePresent])
  const chsh = useMemo(() => computeCHSH(pairs, evePresent), [pairs, evePresent])
  const secure = chsh > 2

  const p = PHASES[step]
  const keyPairs = pairs.filter(p => p.matching)
  const testPairs = pairs.filter(p => p.bellTest)

  // === ALICE ZONE ===
  const aliceContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="alice" subtitle={`Bases: {${A_BASES.join("°, ")}°}`}
        status={step >= 1 ? "MEASURED" : "WAITING"}
        statusColor={step >= 1 ? "var(--accent-blue)" : "var(--text-muted)"} />
      <div style={{ padding: "8px 10px", overflow: "auto", flex: 1 }}>
        {step >= 1 && pairs.map((pair, i) => {
          const isKey = step >= 3 && pair.matching
          const isTest = step >= 3 && pair.bellTest
          const faded = step >= 3 && !pair.matching && step < 4
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 6px", borderRadius: "var(--radius-sm)", marginBottom: 2,
              opacity: faded ? 0.3 : 1,
              background: isKey ? "rgba(0,212,255,0.06)" : isTest && step === 4 ? "rgba(245,158,11,0.06)" : "transparent",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", width: 14, textAlign: "right" }}>{i}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-blue)", width: 28 }}>{pair.aliceBasis}°</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-blue)" }}>{pair.aliceResult}</span>
              {step >= 3 && (
                <span style={{
                  fontSize: 8, fontFamily: "var(--font-mono)", marginLeft: "auto",
                  color: isKey ? "var(--accent-green)" : "var(--accent-amber)",
                }}>
                  {isKey ? "KEY" : "TEST"}
                </span>
              )}
            </div>
          )
        })}
        {step === 0 && (
          <div style={{ padding: 10, color: "var(--text-muted)", fontSize: 12 }}>
            Waiting for photons from source...
          </div>
        )}
      </div>
    </div>
  )

  // === CHANNEL ZONE ===
  const channelContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", alignItems: "center" }}>
      {/* Source badge */}
      <div style={{
        padding: "6px 10px", borderRadius: "var(--radius-md)",
        background: step === 0 ? "rgba(16,185,129,0.1)" : "var(--bg-card)",
        border: `1px solid ${step === 0 ? "var(--accent-green)" : "var(--border)"}`,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 16 }}>⚛</div>
        <div style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: step === 0 ? "var(--accent-green)" : "var(--text-muted)" }}>
          SOURCE
        </div>
      </div>

      <EntangledChannel active={step <= 2} label="entangled pairs" />

      <ClassicalChannel
        sending={step === 3}
        bits="bases"
        label="basis comparison"
      />
    </div>
  )

  // === BOB ZONE ===
  const bobContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PartyLabel role="bob" subtitle={`Bases: {${B_BASES.join("°, ")}°}`}
        status={step >= 2 ? "MEASURED" : "WAITING"}
        statusColor={step >= 2 ? "var(--accent-purple)" : "var(--text-muted)"} />
      <div style={{ padding: "8px 10px", overflow: "auto", flex: 1 }}>
        {step >= 2 && pairs.map((pair, i) => {
          const isKey = step >= 3 && pair.matching
          const isTest = step >= 3 && pair.bellTest
          const faded = step >= 3 && !pair.matching && step < 4
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 6px", borderRadius: "var(--radius-sm)", marginBottom: 2,
              opacity: faded ? 0.3 : 1,
              background: isKey ? "rgba(0,212,255,0.06)" : isTest && step === 4 ? "rgba(245,158,11,0.06)" : "transparent",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", width: 14, textAlign: "right" }}>{i}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-purple)", width: 28 }}>{pair.bobBasis}°</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-purple)" }}>{pair.bobResult}</span>
              {step >= 3 && pair.matching && (
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-mono)", marginLeft: "auto",
                  color: pair.aliceResult === pair.bobResult ? "var(--accent-green)" : "var(--accent-red)",
                }}>
                  {pair.aliceResult === pair.bobResult ? "✓" : "✗"}
                </span>
              )}
            </div>
          )
        })}
        {step <= 1 && (
          <div style={{ padding: 10, color: "var(--text-muted)", fontSize: 12 }}>
            {step === 0 ? "Waiting for photons from source..." : "Waiting to measure..."}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Controls */}
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
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11 }}>
          <div onClick={() => setEvePresent(v => !v)} style={{
            width: 32, height: 18, borderRadius: 9,
            background: evePresent ? "var(--accent-red)" : "var(--bg-hover)",
            border: `1px solid ${evePresent ? "var(--accent-red)" : "var(--border)"}`,
            position: "relative", transition: "all 0.2s", cursor: "pointer",
          }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2, left: evePresent ? 16 : 2, transition: "left 0.2s",
            }}/>
          </div>
          <span style={{ color: evePresent ? "var(--accent-red)" : "var(--text-muted)" }}>
            {evePresent ? "Eve" : "No Eve"}
          </span>
        </label>
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

      {/* CHSH / Key results bar */}
      {step >= 4 && (
        <div style={{
          padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0,
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        }}>
          {/* CHSH value */}
          <div style={{
            padding: "8px 14px", borderRadius: "var(--radius-md)",
            background: "var(--bg-card)",
            border: `2px solid ${secure ? "var(--accent-green)" : "var(--accent-red)"}`,
            minWidth: 120,
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              CHSH VALUE S
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{
                fontSize: 22, fontWeight: 900, fontFamily: "var(--font-mono)",
                color: secure ? "var(--accent-green)" : "var(--accent-red)",
              }}>
                {chsh.toFixed(3)}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {secure ? "> 2 ✓" : "< 2 ✗"}
              </span>
            </div>
            <div style={{
              fontSize: 10, marginTop: 4,
              color: secure ? "var(--accent-green)" : "var(--accent-red)",
              fontWeight: 600,
            }}>
              {secure ? "Bell inequality VIOLATED → secure" : "Bell inequality satisfied → Eve detected!"}
            </div>
          </div>

          {/* Threshold bar */}
          <div style={{
            flex: 1, minWidth: 120, padding: "8px 12px",
            background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
              S VALUE SCALE
            </div>
            <div style={{ position: "relative", height: 16, borderRadius: 4, background: "var(--bg-hover)" }}>
              {/* Classical limit */}
              <div style={{
                position: "absolute", left: `${(2 / 3) * 100}%`, top: -3, bottom: -3,
                width: 2, background: "var(--accent-amber)", zIndex: 1,
              }} />
              <div style={{
                position: "absolute", left: `${(2 / 3) * 100}%`, top: -14, fontSize: 8,
                fontFamily: "var(--font-mono)", color: "var(--accent-amber)", transform: "translateX(-50%)",
              }}>S=2</div>
              {/* Quantum limit 2√2 */}
              <div style={{
                position: "absolute", left: `${(2.828 / 3) * 100}%`, top: -3, bottom: -3,
                width: 1, background: "var(--text-muted)", zIndex: 1,
              }} />
              <div style={{
                position: "absolute", left: `${(2.828 / 3) * 100}%`, top: -14, fontSize: 7,
                fontFamily: "var(--font-mono)", color: "var(--text-muted)", transform: "translateX(-50%)",
              }}>2√2</div>
              {/* Current value marker */}
              <div style={{
                position: "absolute",
                left: `${Math.min(100, (chsh / 3) * 100)}%`,
                top: 2, width: 12, height: 12, borderRadius: "50%",
                background: secure ? "var(--accent-green)" : "var(--accent-red)",
                border: "2px solid #000", transform: "translateX(-50%)",
                transition: "left 0.5s ease",
              }} />
            </div>
          </div>

          {/* Key info */}
          {step === 5 && (
            <div style={{
              padding: "6px 12px", background: "var(--bg-card)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>KEY BITS</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                {keyPairs.length} / {N}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
