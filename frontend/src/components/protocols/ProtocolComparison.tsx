
import { useState } from "react"

interface Cell { content: string; tooltip: string }

const DIMENSIONS = [
  "Security basis",
  "Classical bits needed",
  "Quantum resource",
  "Eve detection",
  "Efficiency",
  "Use case",
]

const DATA: Record<string, Cell[]> = {
  BB84: [
    { content: "QBER threshold", tooltip: "If the Quantum Bit Error Rate exceeds ~11%, the key is aborted because an eavesdropper is likely present." },
    { content: "Basis reconciliation", tooltip: "Alice and Bob publicly compare bases after measurement. Only matching-basis bits are kept — about 50% of raw bits." },
    { content: "Single qubits", tooltip: "Alice prepares and sends individual photons polarized in random bases (+, ×). No entanglement is needed." },
    { content: "QBER > 11%", tooltip: "Eve's intercept-resend attack introduces errors. A QBER above the 11% threshold is statistically impossible without eavesdropping." },
    { content: "~50% key rate", tooltip: "Half the qubits are discarded during basis sifting (Alice and Bob chose different bases). Of the remainder, some are used for error estimation." },
    { content: "QKD", tooltip: "Quantum Key Distribution — the primary application. Establishes a shared secret key provably secure against quantum attacks." },
  ],
  E91: [
    { content: "Bell inequality", tooltip: "Security relies on the CHSH form of Bell's inequality. Violation (S > 2) proves quantum correlations exist and no local hidden variable (Eve) interfered." },
    { content: "Basis comparison", tooltip: "Alice and Bob announce measurement angles. Matching angles yield key bits; non-matching angles are used for the CHSH test." },
    { content: "Entangled pairs", tooltip: "A central source emits maximally entangled |Φ+⟩ pairs. Alice and Bob each receive one photon from each pair." },
    { content: "CHSH S < 2", tooltip: "If the CHSH value S drops below 2, Bell's inequality is no longer violated — indicating Eve has disrupted the entanglement." },
    { content: "~25% key rate", tooltip: "Only 2 of the 9 basis combinations yield matching angles. The rest are used for the Bell test." },
    { content: "QKD + Bell test", tooltip: "Not just key distribution — also a fundamental test of quantum mechanics (Bell inequality violation). Two-in-one protocol." },
  ],
  Superdense: [
    { content: "Pre-shared entanglement", tooltip: "Security assumes Alice and Bob securely shared the entangled pair beforehand. The protocol itself has no eavesdropper detection." },
    { content: "0 (encoding step)", tooltip: "No classical bits are needed during encoding. Alice sends only her qubit. The classical bits are created at Bob's end after measurement." },
    { content: "Entangled pairs", tooltip: "Alice and Bob each hold one qubit of a Bell pair |Φ+⟩. Alice's encoding gate changes the joint Bell state." },
    { content: "N/A (assumes secure)", tooltip: "Superdense coding does not detect eavesdroppers. It assumes the quantum channel is secure." },
    { content: "2 bits per qubit", tooltip: "The key advantage: Alice transmits 2 classical bits of information by sending just 1 qubit. This beats the classical limit of 1 bit per channel use." },
    { content: "Dense communication", tooltip: "Doubles classical communication capacity using quantum resources. Useful for bandwidth-constrained quantum networks." },
  ],
}

const PROTOCOL_COLORS: Record<string, string> = {
  BB84: "var(--accent-cyan)",
  E91: "var(--accent-purple)",
  Superdense: "var(--accent-amber)",
}

export function ProtocolComparison() {
  const [tooltip, setTooltip] = useState<{ row: number; col: string } | null>(null)
  const protocols = Object.keys(DATA)

  return (
    <div style={{ padding: 20, height: "100%", overflow: "auto" }}>
      <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Protocol Comparison</h3>
      <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
        Compare the three quantum protocols across key dimensions. Click any cell for a detailed explanation.
      </p>

      <div style={{
        borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{
                padding: "10px 12px", textAlign: "left",
                background: "var(--bg-panel)", borderBottom: "1px solid var(--border)",
                fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
              }}>DIMENSION</th>
              {protocols.map(p => (
                <th key={p} style={{
                  padding: "10px 12px", textAlign: "center",
                  background: "var(--bg-panel)", borderBottom: "1px solid var(--border)",
                  borderLeft: "1px solid var(--border)",
                  fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)",
                  color: PROTOCOL_COLORS[p],
                }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((dim, ri) => (
              <tr key={dim}>
                <td style={{
                  padding: "10px 12px", fontWeight: 600, fontSize: 11,
                  color: "var(--text-primary)",
                  borderBottom: ri < DIMENSIONS.length - 1 ? "1px solid var(--border)" : "none",
                  background: "var(--bg-card)",
                }}>{dim}</td>
                {protocols.map(p => {
                  const cell = DATA[p][ri]
                  const isActive = tooltip?.row === ri && tooltip?.col === p
                  return (
                    <td key={p}
                      onClick={() => setTooltip(isActive ? null : { row: ri, col: p })}
                      style={{
                        padding: "10px 12px", textAlign: "center",
                        borderLeft: "1px solid var(--border)",
                        borderBottom: ri < DIMENSIONS.length - 1 ? "1px solid var(--border)" : "none",
                        cursor: "pointer",
                        background: isActive ? `color-mix(in srgb, ${PROTOCOL_COLORS[p]} 8%, transparent)` : "transparent",
                        transition: "background 0.2s",
                        position: "relative",
                      }}>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 10,
                        color: PROTOCOL_COLORS[p], fontWeight: 600,
                      }}>
                        {cell.content}
                      </div>
                      {isActive && (
                        <div style={{
                          position: "absolute", left: 4, right: 4, top: "100%",
                          zIndex: 10, marginTop: 4,
                          padding: "8px 10px", borderRadius: "var(--radius-md)",
                          background: "var(--bg-panel)", border: `1px solid ${PROTOCOL_COLORS[p]}`,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6,
                          textAlign: "left",
                        }}>
                          {cell.tooltip}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key differences callout */}
      <div style={{
        marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap",
      }}>
        {[
          { label: "BB84", icon: "🔐", desc: "Prepare-and-measure QKD", color: "var(--accent-cyan)" },
          { label: "E91", icon: "🔗", desc: "Entanglement-based QKD + Bell test", color: "var(--accent-purple)" },
          { label: "Superdense", icon: "⇌", desc: "2 bits from 1 qubit", color: "var(--accent-amber)" },
        ].map(({ label, icon, desc, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 140, padding: "10px 14px",
            background: "var(--bg-card)", borderRadius: "var(--radius-md)",
            border: `1px solid ${color}33`,
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{label}</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
