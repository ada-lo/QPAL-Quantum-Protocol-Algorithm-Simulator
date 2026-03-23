import { useState, useMemo } from "react"

type ErrorType = 'none' | 'bit_flip' | 'phase_flip' | 'both'
type Code = '3bit' | '3phase' | '9shor'

const CODE_INFO: Record<Code, { name: string; nLogical: number; nPhysical: number; color: string; desc: string }> = {
  '3bit':   { name: '3-qubit Bit-flip', nLogical: 1, nPhysical: 3, color: '#EF5350', desc: 'Corrects single X (bit-flip) errors: |0⟩→|000⟩, |1⟩→|111⟩' },
  '3phase': { name: '3-qubit Phase-flip', nLogical: 1, nPhysical: 3, color: '#AB47BC', desc: 'Corrects single Z (phase-flip) errors: |0⟩→|+++⟩, |1⟩→|−−−⟩' },
  '9shor':  { name: "Shor's 9-qubit", nLogical: 1, nPhysical: 9, color: '#FF6F00', desc: 'Corrects arbitrary single-qubit errors (X, Y, Z) using 9 physical qubits' },
}

function simulateQEC(code: Code, error: ErrorType, errorQubit: number) {
  const info = CODE_INFO[code]
  const n = info.nPhysical

  // Encoding
  let encoded: string[] = []
  if (code === '3bit') encoded = ['|0⟩', '|0⟩', '|0⟩']  // |0⟩L = |000⟩
  else if (code === '3phase') encoded = ['|+⟩', '|+⟩', '|+⟩']
  else encoded = ['|0⟩', '|0⟩', '|0⟩', '|0⟩', '|0⟩', '|0⟩', '|0⟩', '|0⟩', '|0⟩']

  // Apply error
  const afterError = [...encoded]
  if (error !== 'none' && errorQubit < n) {
    if (error === 'bit_flip') afterError[errorQubit] = afterError[errorQubit] === '|0⟩' ? '|1⟩' : '|0⟩'
    else if (error === 'phase_flip') afterError[errorQubit] = afterError[errorQubit] + '(Z)'
    else { afterError[errorQubit] = '|?⟩(XZ)' }
  }

  // Syndrome measurement
  let syndromes: string[] = []
  let detectedQubit = -1
  if (code === '3bit' || code === '3phase') {
    const s1 = afterError[0] !== afterError[1] ? 1 : 0
    const s2 = afterError[1] !== afterError[2] ? 1 : 0
    syndromes = [`Z₁Z₂ = ${s1}`, `Z₂Z₃ = ${s2}`]
    if (s1 && !s2) detectedQubit = 0
    else if (s1 && s2) detectedQubit = 1
    else if (!s1 && s2) detectedQubit = 2
  } else {
    // Shor code: detect in blocks
    const blocks = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8]
    ]
    for (let b = 0; b < 3; b++) {
      const [i, j, k] = blocks[b]
      const s1 = afterError[i] !== afterError[j] ? 1 : 0
      const s2 = afterError[j] !== afterError[k] ? 1 : 0
      syndromes.push(`Block${b}: ${s1}${s2}`)
      if (s1 || s2) detectedQubit = errorQubit  // Correct block/qubit
    }
  }

  // Correction
  const corrected = [...afterError]
  const canCorrect = (code === '3bit' && (error === 'bit_flip' || error === 'none'))
    || (code === '3phase' && (error === 'phase_flip' || error === 'none'))
    || (code === '9shor')
    || error === 'none'

  if (detectedQubit >= 0 && canCorrect) corrected[detectedQubit] = encoded[detectedQubit]

  return { encoded, afterError, syndromes, detectedQubit, corrected, canCorrect, info }
}

export function QECAnimator() {
  const [code, setCode] = useState<Code>('3bit')
  const [error, setError] = useState<ErrorType>('bit_flip')
  const [errorQubit, setErrorQubit] = useState(1)
  const [step, setStep] = useState(0)

  const result = useMemo(
    () => simulateQEC(code, error, errorQubit),
    [code, error, errorQubit]
  )

  const stages = ["Encode logical qubit", "Introduce error", "Syndrome measurement", "Correct error", "Verify"]

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Quantum Error Correction</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Protect quantum information by encoding 1 logical qubit into{' '}
        <strong style={{ color: result.info.color }}>{result.info.nPhysical} physical qubits</strong>.
        Detects and corrects errors via syndrome measurements without collapsing the quantum state.
      </p>

      {/* Code selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {(Object.keys(CODE_INFO) as Code[]).map(c => (
          <button key={c} onClick={() => { setCode(c); setErrorQubit(1); setStep(0) }} style={{
            padding: "8px 14px", borderRadius: 6, fontSize: 11,
            background: code === c ? CODE_INFO[c].color : "var(--bg-card)",
            color: code === c ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${code === c ? CODE_INFO[c].color : "var(--border)"}`,
          }}>
            <div style={{ fontWeight: 700 }}>{CODE_INFO[c].name}</div>
            <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>
              {CODE_INFO[c].nLogical}→{CODE_INFO[c].nPhysical} qubits
            </div>
          </button>
        ))}
      </div>

      {/* Error controls */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Error type</div>
          <div style={{ display: "flex", gap: 4 }}>
            {([['none', 'None'], ['bit_flip', 'X (bit)'], ['phase_flip', 'Z (phase)'], ['both', 'XZ']] as [ErrorType, string][]).map(([t, l]) => (
              <button key={t} onClick={() => { setError(t); setStep(0) }} style={{
                padding: "3px 10px", borderRadius: 3, fontSize: 10,
                background: error === t ? result.info.color : "var(--bg-card)",
                color: error === t ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${error === t ? result.info.color : "var(--border)"}`,
              }}>{l}</button>
            ))}
          </div>
        </div>
        {error !== 'none' && (
          <div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Error qubit</div>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: result.info.nPhysical }, (_, i) => (
                <button key={i} onClick={() => { setErrorQubit(i); setStep(0) }} style={{
                  width: 24, height: 24, borderRadius: 3, fontSize: 10,
                  background: errorQubit === i ? "#EF5350" : "var(--bg-card)",
                  color: errorQubit === i ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${errorQubit === i ? "#EF5350" : "var(--border)"}`,
                }}>{i}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {stages.map((label, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            padding: "4px 10px", borderRadius: 4, fontSize: 10,
            background: step >= i ? result.info.color : "var(--bg-card)",
            color: step >= i ? "#fff" : "var(--text-muted)",
            border: `1px solid ${step >= i ? result.info.color : "var(--border)"}`,
          }}>{i + 1}. {label}</button>
        ))}
      </div>

      {/* Qubit visualization */}
      <div style={{
        padding: "14px 16px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 10 }}>
          PHYSICAL QUBITS — {result.info.name}
        </div>

        {/* Encoded state */}
        {step >= 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>Encoded:</div>
            <div style={{ display: "flex", gap: 4 }}>
              {result.encoded.map((s, i) => (
                <div key={i} style={{
                  padding: "6px 10px", borderRadius: 4, fontSize: 11,
                  fontFamily: "var(--font-mono)", fontWeight: 700,
                  background: "rgba(102,187,106,0.1)", color: "#66BB6A",
                  border: "1px solid rgba(102,187,106,0.3)",
                }}>q{i}: {s}</div>
              ))}
            </div>
          </div>
        )}

        {/* After error */}
        {step >= 1 && error !== 'none' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "#EF5350", marginBottom: 4 }}>After error on q{errorQubit}:</div>
            <div style={{ display: "flex", gap: 4 }}>
              {result.afterError.map((s, i) => (
                <div key={i} style={{
                  padding: "6px 10px", borderRadius: 4, fontSize: 11,
                  fontFamily: "var(--font-mono)", fontWeight: 700,
                  background: i === errorQubit ? "rgba(239,83,80,0.1)" : "rgba(102,187,106,0.05)",
                  color: i === errorQubit ? "#EF5350" : "#66BB6A",
                  border: `1px solid ${i === errorQubit ? "rgba(239,83,80,0.3)" : "rgba(102,187,106,0.15)"}`,
                }}>q{i}: {s}</div>
              ))}
            </div>
          </div>
        )}

        {/* Syndromes */}
        {step >= 2 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: result.info.color, marginBottom: 4 }}>Syndrome measurements:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {result.syndromes.map((s, i) => (
                <span key={i} style={{
                  padding: "3px 8px", borderRadius: 3, fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}>{s}</span>
              ))}
              {result.detectedQubit >= 0 && (
                <span style={{
                  padding: "3px 8px", borderRadius: 3, fontSize: 10,
                  fontFamily: "var(--font-mono)", fontWeight: 700,
                  background: "rgba(239,83,80,0.1)", color: "#EF5350",
                  border: "1px solid rgba(239,83,80,0.3)",
                }}>Error at q{result.detectedQubit}</span>
              )}
            </div>
          </div>
        )}

        {/* Corrected */}
        {step >= 3 && (
          <div>
            <div style={{ fontSize: 9, color: result.canCorrect ? "#66BB6A" : "#EF5350", marginBottom: 4 }}>
              {result.canCorrect ? "✓ Corrected:" : "✗ Cannot correct (wrong code for this error type):"}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {result.corrected.map((s, i) => (
                <div key={i} style={{
                  padding: "6px 10px", borderRadius: 4, fontSize: 11,
                  fontFamily: "var(--font-mono)", fontWeight: 700,
                  background: result.canCorrect ? "rgba(102,187,106,0.1)" : "rgba(239,83,80,0.05)",
                  color: result.canCorrect ? "#66BB6A" : "var(--text-secondary)",
                  border: `1px solid ${result.canCorrect ? "rgba(102,187,106,0.3)" : "rgba(239,83,80,0.15)"}`,
                }}>q{i}: {s}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        padding: "10px 14px", background: "var(--bg-card)", borderRadius: 8,
        border: "1px solid var(--border)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7,
      }}>
        <span style={{ color: result.info.color, fontWeight: 700 }}>Code info: </span>
        {result.info.desc}
      </div>
    </div>
  )
}
