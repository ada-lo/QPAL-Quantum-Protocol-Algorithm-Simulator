import { useState, useMemo } from "react"

interface BellMeasurement {
  aliceBasis: number  // angle in degrees: 0, 45, 90
  bobBasis: number    // angle: 0, 45, 90
  aliceResult: -1 | 1
  bobResult: -1 | 1
}

function generateE91Rounds(n: number, seed: number): BellMeasurement[] {
  const rng = (i: number) => ((seed * 1103515245 + 12345 + i * 31) >>> 16) & 0x7fff
  const aliceBases = [0, 45, 90]
  const bobBases = [0, 45, 90]
  return Array.from({ length: n }, (_, i) => {
    const aIdx = rng(i * 2) % 3
    const bIdx = rng(i * 2 + 1) % 3
    const aBasis = aliceBases[aIdx]
    const bBasis = bobBases[bIdx]
    // Quantum correlation: P(same) depends on angle difference
    const angleDiff = Math.abs(aBasis - bBasis) * Math.PI / 180
    const corrProb = Math.cos(angleDiff / 2) ** 2
    const aResult: -1 | 1 = rng(i * 3) % 2 === 0 ? 1 : -1
    const correlated = (rng(i * 4) % 1000) / 1000 < corrProb
    const bResult: -1 | 1 = correlated ? aResult : (aResult === 1 ? -1 : 1)
    return { aliceBasis: aBasis, bobBasis: bBasis, aliceResult: aResult, bobResult: bResult }
  })
}

export function E91Animator() {
  const [nRounds, setNRounds] = useState(50)
  const [seed, setSeed] = useState(42)
  const [step, setStep] = useState(0) // 0=generate, 1=measure, 2=sift, 3=bell test, 4=key

  const rounds = useMemo(() => generateE91Rounds(nRounds, seed), [nRounds, seed])

  // Sifting: keep only matching basis
  const sifted = rounds.filter(r => r.aliceBasis === r.bobBasis)
  const keyBits = sifted.map(r => r.aliceResult === 1 ? 1 : 0)

  // Bell test on non-matching basis
  const bellTest = rounds.filter(r => r.aliceBasis !== r.bobBasis)
  // CHSH inequality: S ≤ 2 classically, S ≈ 2√2 quantum
  const S = useMemo(() => {
    // Compute correlation average
    let sumCorr = 0
    for (const r of bellTest) {
      sumCorr += r.aliceResult * r.bobResult
    }
    const E = bellTest.length > 0 ? sumCorr / bellTest.length : 0
    // Approximate S value from correlation
    return Math.abs(E * 2.82)  // Scaled to approximate CHSH
  }, [bellTest])

  const isSecure = S > 2.0
  const stages = ["Generate Bell pairs", "Measure independently", "Sift matching bases", "Bell inequality test", "Extract key"]

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>E91 Protocol — Ekert's QKD</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Entanglement-based quantum key distribution. Security proven via{' '}
        <strong style={{ color: "#AB47BC" }}>Bell inequality violation</strong> — any eavesdropper
        would reduce correlations below the quantum threshold.
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Rounds</div>
          <input type="range" min={20} max={200} value={nRounds}
            onChange={e => { setNRounds(Number(e.target.value)); setStep(0) }}
            style={{ width: 120, accentColor: "#AB47BC" }} />
          <span style={{ marginLeft: 6, fontSize: 11, fontFamily: "var(--font-mono)", color: "#AB47BC" }}>{nRounds}</span>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Seed</div>
          <input type="range" min={1} max={999} value={seed}
            onChange={e => { setSeed(Number(e.target.value)); setStep(0) }}
            style={{ width: 80, accentColor: "#AB47BC" }} />
        </div>
      </div>

      {/* Step progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {stages.map((label, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            padding: "5px 12px", borderRadius: 4, fontSize: 11,
            background: step >= i ? "#AB47BC" : "var(--bg-card)",
            color: step >= i ? "#fff" : "var(--text-muted)",
            border: `1px solid ${step >= i ? "#AB47BC" : "var(--border)"}`,
            opacity: step >= i ? 1 : 0.6,
          }}>{i + 1}. {label}</button>
        ))}
      </div>

      {/* Round visualization */}
      {step >= 1 && (
        <div style={{
          padding: "12px 14px", background: "var(--bg-panel)", borderRadius: 8,
          border: "1px solid var(--border)", marginBottom: 16,
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            MEASUREMENTS (first 20 of {nRounds})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr auto", gap: "2px 8px", fontSize: 10, fontFamily: "var(--font-mono)" }}>
            <div style={{ color: "var(--text-muted)" }}>#</div>
            <div style={{ color: "var(--accent-cyan)" }}>A basis</div>
            <div style={{ color: "var(--accent-cyan)" }}>A result</div>
            <div style={{ color: "#AB47BC" }}>B basis</div>
            <div style={{ color: "#AB47BC" }}>B result</div>
            <div style={{ color: "var(--text-muted)" }}>Match?</div>
            {rounds.slice(0, 20).map((r, i) => {
              const match = r.aliceBasis === r.bobBasis
              return [
                <div key={`n${i}`} style={{ color: "var(--text-muted)" }}>{i}</div>,
                <div key={`ab${i}`} style={{ color: "var(--accent-cyan)" }}>{r.aliceBasis}°</div>,
                <div key={`ar${i}`} style={{ color: r.aliceResult > 0 ? "#66BB6A" : "#EF5350" }}>{r.aliceResult > 0 ? "+1" : "−1"}</div>,
                <div key={`bb${i}`} style={{ color: "#AB47BC" }}>{r.bobBasis}°</div>,
                <div key={`br${i}`} style={{ color: r.bobResult > 0 ? "#66BB6A" : "#EF5350" }}>{r.bobResult > 0 ? "+1" : "−1"}</div>,
                <div key={`m${i}`} style={{
                  color: match ? "#66BB6A" : "var(--text-muted)",
                  fontWeight: match ? 700 : 400,
                }}>{match ? "✓" : "—"}</div>,
              ]
            })}
          </div>
        </div>
      )}

      {/* Bell test result */}
      {step >= 3 && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 16,
          background: isSecure ? "rgba(171,71,188,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${isSecure ? "rgba(171,71,188,0.3)" : "rgba(239,68,68,0.3)"}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: isSecure ? "#AB47BC" : "#EF5350", marginBottom: 6 }}>
            CHSH parameter S = {S.toFixed(3)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 8, background: "var(--bg-hover)", borderRadius: 4, position: "relative" }}>
              <div style={{
                width: `${Math.min(100, (S / 2.83) * 100)}%`, height: "100%",
                background: isSecure ? "#AB47BC" : "#EF5350", borderRadius: 4,
              }} />
              <div style={{
                position: "absolute", top: -2, left: `${(2 / 2.83) * 100}%`,
                width: 1, height: 12, background: "var(--text-muted)",
              }} />
            </div>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            Classical limit: S ≤ 2 | Quantum: S = 2√2 ≈ 2.828 |
            {isSecure ? " ✓ SECURE — Bell violation detected" : " ✗ INSECURE — possible eavesdropper"}
          </div>
        </div>
      )}

      {/* Key */}
      {step >= 4 && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, background: "rgba(102,187,106,0.08)",
          border: "1px solid rgba(102,187,106,0.3)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#66BB6A", marginBottom: 6 }}>
            Shared key: {keyBits.length} bits
          </div>
          <div style={{
            fontSize: 11, fontFamily: "var(--font-mono)", color: "#66BB6A",
            wordBreak: "break-all",
          }}>
            {keyBits.slice(0, 40).join("")}{keyBits.length > 40 ? "…" : ""}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
            Sifting rate: {((sifted.length / nRounds) * 100).toFixed(0)}% | Bell test rounds: {bellTest.length}
          </div>
        </div>
      )}
    </div>
  )
}
