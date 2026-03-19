
import { useState } from "react"

const BELL: Record<string, { state: string; ops: string; circuit: string[] }> = {
  "00": { state: "|Φ+⟩ = (|00⟩+|11⟩)/√2", ops: "Identity (I)",   circuit: ["·","·"] },
  "01": { state: "|Ψ+⟩ = (|01⟩+|10⟩)/√2", ops: "Pauli-X",        circuit: ["X","·"] },
  "10": { state: "|Φ-⟩ = (|00⟩-|11⟩)/√2", ops: "Pauli-Z",        circuit: ["Z","·"] },
  "11": { state: "|Ψ-⟩ = (|01⟩-|10⟩)/√2", ops: "iY (= ZX)",      circuit: ["Z","X"] },
}

export function SuperdenseAnimator() {
  const [bits, setBits] = useState<[0|1, 0|1]>([0, 0])
  const [showDecoded, setShowDecoded] = useState(false)

  const key = `${bits[0]}${bits[1]}`
  const enc = BELL[key]

  const toggle = (i: 0|1) => {
    setBits(b => { const nb = [...b] as [0|1,0|1]; nb[i] = (nb[i]^1) as 0|1; return nb })
    setShowDecoded(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, height: "100%", overflow: "auto" }}>
      <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Superdense Coding</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
        Alice wants to send 2 classical bits to Bob by transmitting only 1 qubit.
        This is possible because they pre-share a Bell pair.
      </p>

      {/* Bit selector */}
      <div style={{
        padding: "14px 16px", borderRadius: "var(--radius-lg)",
        background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 10 }}>
          ALICE WANTS TO SEND
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {([0,1] as const).map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>bit {i}</span>
              <button onClick={() => toggle(i)} style={{
                width: 48, height: 48, borderRadius: "var(--radius-md)",
                fontSize: 22, fontWeight: 900, fontFamily: "var(--font-mono)",
                background: bits[i] ? "rgba(0,212,255,0.15)" : "rgba(59,130,246,0.10)",
                color: bits[i] ? "var(--accent-cyan)" : "var(--accent-blue)",
                border: `2px solid ${bits[i] ? "var(--accent-cyan)" : "var(--accent-blue)"}`,
                transition: "all var(--transition)", cursor: "pointer",
              }}>{bits[i]}</button>
            </div>
          ))}
          <div style={{ fontSize: 28, color: "var(--border-bright)" }}>→</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>message</span>
            <div style={{
              width: 64, height: 48, borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,212,255,0.08)", border: "2px solid var(--accent-cyan)",
              fontSize: 26, fontWeight: 900, fontFamily: "var(--font-mono)",
              color: "var(--accent-cyan)", letterSpacing: 4,
            }}>{key}</div>
          </div>
        </div>
      </div>

      {/* Protocol flow */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {/* Step 1 */}
        <FlowStep num={1} color="var(--accent-purple)" label="Shared Bell pair">
          Alice and Bob each hold one qubit of |Φ+⟩ = (|00⟩ + |11⟩)/√2
        </FlowStep>

        {/* Step 2 */}
        <FlowStep num={2} color="var(--accent-amber)" label={`Alice applies: ${enc.ops}`}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            {enc.circuit.map((op, i) => (
              <span key={i} style={{
                width: 32, height: 28, display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                background: op !== "·" ? "rgba(245,158,11,0.15)" : "transparent",
                border: `1px solid ${op !== "·" ? "var(--accent-amber)" : "var(--border)"}`,
                color: op !== "·" ? "var(--accent-amber)" : "var(--text-muted)",
              }}>{op}</span>
            ))}
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>on her qubit → sends it to Bob</span>
          </div>
        </FlowStep>

        {/* Step 3 */}
        <FlowStep num={3} color="var(--accent-green)" label="Shared state becomes">
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontSize: 13, fontWeight: 700 }}>
            {enc.state}
          </span>
        </FlowStep>

        {/* Step 4 */}
        <FlowStep num={4} color="var(--accent-cyan)" label="Bob decodes">
          Bob applies CNOT then Hadamard, then measures to recover
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontWeight: 700, marginLeft: 4 }}>
            "{key}"
          </span>
          <button onClick={() => setShowDecoded(v => !v)} style={{
            marginLeft: 10, fontSize: 10, color: "var(--accent-cyan)",
            border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-sm)",
            padding: "1px 8px", cursor: "pointer", background: "transparent",
          }}>
            {showDecoded ? "hide" : "show decode"}
          </button>
          {showDecoded && (
            <div style={{
              marginTop: 8, padding: "8px 10px",
              background: "rgba(0,212,255,0.06)", borderRadius: "var(--radius-md)",
              border: "1px solid rgba(0,212,255,0.2)",
            }}>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                1. CNOT(q₀, q₁)<br/>
                2. H(q₀)<br/>
                3. Measure → <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{key}</span>
              </div>
            </div>
          )}
        </FlowStep>
      </div>

      {/* Encoding table */}
      <div style={{
        padding: "12px 14px", borderRadius: "var(--radius-lg)",
        background: "var(--bg-card)", border: "1px solid var(--border)",
      }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 10 }}>
          FULL ENCODING TABLE
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "var(--font-mono)" }}>
          <thead>
            <tr>
              {["Bits","Operation","Bell State","Bob Measures"].map(h => (
                <th key={h} style={{
                  padding: "4px 10px", textAlign: "left",
                  color: "var(--text-muted)", fontWeight: 400, fontSize: 10,
                  borderBottom: "1px solid var(--border)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(BELL).map(([k, v]) => (
              <tr key={k} style={{
                background: k === key ? "rgba(0,212,255,0.06)" : "transparent",
              }}>
                <td style={{
                  padding: "5px 10px", fontWeight: 700,
                  color: k === key ? "var(--accent-cyan)" : "var(--text-secondary)",
                }}>{k}</td>
                <td style={{ padding: "5px 10px", color: "var(--accent-amber)" }}>{v.ops}</td>
                <td style={{ padding: "5px 10px", color: "var(--text-secondary)", fontSize: 10 }}>{v.state.split("=")[0].trim()}</td>
                <td style={{ padding: "5px 10px", fontWeight: 700, color: k === key ? "var(--accent-cyan)" : "var(--text-muted)" }}>{k}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FlowStep({ num, color, label, children }: {
  num: number; color: string; label: string; children: React.ReactNode
}) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "10px 12px",
      borderRadius: "var(--radius-md)", background: "var(--bg-card)",
      border: "1px solid var(--border)",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: `${color}20`, border: `1.5px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color, fontFamily: "var(--font-mono)",
      }}>{num}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  )
}
