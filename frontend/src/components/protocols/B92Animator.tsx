import { useState, useMemo } from "react"

function generateB92Rounds(n: number, seed: number) {
  const rng = (i: number) => ((seed * 1103515245 + 12345 + i * 37) >>> 16) & 0x7fff
  return Array.from({ length: n }, (_, i) => {
    const aliceBit = rng(i * 2) % 2  // 0 → |0⟩, 1 → |+⟩
    const bobBasis = rng(i * 2 + 1) % 2  // 0 → Z basis, 1 → X basis
    // B92: Bob detects only when he measures in the "wrong" basis
    // If Alice sends |0⟩ and Bob measures in X basis: 50% detection
    // If Alice sends |+⟩ and Bob measures in Z basis: 50% detection
    const crossBasis = (aliceBit === 0 && bobBasis === 1) || (aliceBit === 1 && bobBasis === 0)
    const detected = crossBasis && (rng(i * 3) % 2 === 0)
    return {
      aliceBit,
      aliceState: aliceBit === 0 ? '|0⟩' : '|+⟩',
      bobBasis: bobBasis === 0 ? 'Z' : 'X',
      detected,
      keyBit: detected ? (1 - aliceBit) : null,  // Sifted key bit
    }
  })
}

export function B92Animator() {
  const [nRounds, setNRounds] = useState(40)
  const [seed, setSeed] = useState(42)
  const [step, setStep] = useState(0)

  const rounds = useMemo(() => generateB92Rounds(nRounds, seed), [nRounds, seed])
  const detected = rounds.filter(r => r.detected)
  const keyBits = detected.map(r => r.keyBit!)

  const stages = ["Alice prepares states", "Bob measures randomly", "Sift: Bob announces detections", "Extract shared key"]

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>B92 Protocol — Simplified QKD</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Uses only <strong style={{ color: "#26A69A" }}>2 non-orthogonal states</strong> (|0⟩ and |+⟩)
        instead of BB84's 4. Secure because non-orthogonal states cannot be cloned.
        Simpler but lower key rate than BB84.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Rounds</div>
          <input type="range" min={20} max={100} value={nRounds}
            onChange={e => { setNRounds(Number(e.target.value)); setStep(0) }}
            style={{ width: 120, accentColor: "#26A69A" }} />
          <span style={{ marginLeft: 6, fontSize: 11, fontFamily: "var(--font-mono)", color: "#26A69A" }}>{nRounds}</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {stages.map((label, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            padding: "5px 12px", borderRadius: 4, fontSize: 11,
            background: step >= i ? "#26A69A" : "var(--bg-card)",
            color: step >= i ? "#fff" : "var(--text-muted)",
            border: `1px solid ${step >= i ? "#26A69A" : "var(--border)"}`,
          }}>{i + 1}. {label}</button>
        ))}
      </div>

      {/* State comparison */}
      <div style={{
        padding: "12px 14px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
          B92 vs BB84 — STATE COMPARISON
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: "8px 10px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#26A69A", marginBottom: 4 }}>B92 (this protocol)</div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
              bit 0 → |0⟩<br />bit 1 → |+⟩
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>Only 2 states</div>
          </div>
          <div style={{ padding: "8px 10px", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 4 }}>BB84</div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
              bit 0 → |0⟩ or |+⟩<br />bit 1 → |1⟩ or |−⟩
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>4 states, 2 bases</div>
          </div>
        </div>
      </div>

      {/* Round display */}
      {step >= 1 && (
        <div style={{
          padding: "12px 14px", background: "var(--bg-panel)", borderRadius: 8,
          border: "1px solid var(--border)", marginBottom: 16,
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            ROUNDS (first 20 of {nRounds})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: "2px 10px", fontSize: 10, fontFamily: "var(--font-mono)" }}>
            <div style={{ color: "var(--text-muted)" }}>#</div>
            <div style={{ color: "var(--accent-cyan)" }}>Alice state</div>
            <div style={{ color: "#AB47BC" }}>Bob basis</div>
            <div style={{ color: "var(--text-secondary)" }}>Detected?</div>
            <div style={{ color: "#66BB6A" }}>Key bit</div>
            {rounds.slice(0, 20).map((r, i) => [
              <div key={`n${i}`} style={{ color: "var(--text-muted)" }}>{i}</div>,
              <div key={`as${i}`} style={{ color: "var(--accent-cyan)" }}>{r.aliceState}</div>,
              <div key={`bb${i}`} style={{ color: "#AB47BC" }}>{r.bobBasis}</div>,
              <div key={`d${i}`} style={{ color: r.detected ? "#66BB6A" : "var(--text-muted)", fontWeight: r.detected ? 700 : 400 }}>
                {r.detected ? "✓ yes" : "—"}
              </div>,
              <div key={`k${i}`} style={{ color: r.keyBit !== null ? "#66BB6A" : "var(--text-muted)" }}>
                {r.keyBit !== null ? r.keyBit : "—"}
              </div>,
            ])}
          </div>
        </div>
      )}

      {/* Key */}
      {step >= 3 && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, background: "rgba(102,187,106,0.08)",
          border: "1px solid rgba(102,187,106,0.3)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#66BB6A", marginBottom: 6 }}>
            Shared key: {keyBits.length} bits
          </div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#66BB6A", wordBreak: "break-all" }}>
            {keyBits.join("")}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
            Detection rate: {((detected.length / nRounds) * 100).toFixed(0)}% (≈25% theoretical)
          </div>
        </div>
      )}
    </div>
  )
}
