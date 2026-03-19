import { useNavigate } from "react-router-dom"

const CARDS = [
  { to: "/simulator",  emoji: "⟨ψ⟩", title: "Circuit Simulator",   desc: "Build quantum circuits with up to 20 qubits. GPU-accelerated via QDD backend." },
  { to: "/protocols",  emoji: "🔐",  title: "Protocol Animator",    desc: "Visualize BB84, Quantum Teleportation, Superdense Coding with animated multi-party flows." },
  { to: "/algorithms", emoji: "⚙",  title: "Algorithm Explorer",   desc: "Step through Grover search, Shor factoring, and QAOA gate-by-gate." },
]

export function Home() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 48, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
        Quantum Protocol &<br />
        <span style={{ color: "var(--accent-cyan)" }}>Algorithm Simulator</span>
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 48, fontSize: 15, maxWidth: 520 }}>
        A noise-aware, scalable quantum simulator solving Gap 2 (decoherence visualization)
        and Gap 3 (QDD-backed 20+ qubit simulation) from current literature.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {CARDS.map(card => (
          <button key={card.to} onClick={() => navigate(card.to)} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", padding: 28, textAlign: "left",
            cursor: "pointer", transition: "all var(--transition)",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent-cyan)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{card.emoji}</div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{card.title}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>{card.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 48, padding: 20, background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>RESEARCH GAPS ADDRESSED</div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <span style={{ color: "var(--accent-amber)", fontWeight: 600, fontSize: 13 }}>Gap 2 —</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}> Real-time noise/decoherence visualization with Qiskit Aer noise models</span>
          </div>
          <div>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 600, fontSize: 13 }}>Gap 3 —</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}> Scalable simulation beyond 6 qubits using mqt-ddsim QDD backend</span>
          </div>
        </div>
      </div>
    </div>
  )
}
