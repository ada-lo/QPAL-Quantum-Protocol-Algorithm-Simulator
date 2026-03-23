import { ArrowRight, BookOpen, BrainCircuit, Orbit } from "lucide-react"
import { useNavigate } from "react-router-dom"

const PATHS = [
  {
    to: "/simulator",
    title: "Circuit studio",
    subtitle: "Build and inspect",
    description: "Load a lesson, place gates, and connect the circuit to state vectors, Bloch views, and guided pseudocode.",
    icon: BrainCircuit,
  },
  {
    to: "/protocols",
    title: "Protocol lessons",
    subtitle: "Communication and cryptography",
    description: "Follow BB84, teleportation, superdense coding, and error-correction flows in a calmer guided workspace.",
    icon: Orbit,
  },
  {
    to: "/algorithms",
    title: "Algorithm lessons",
    subtitle: "Search, phase, and optimization",
    description: "Study Grover, QFT, QPE, QAOA, VQE, and quantum walks with simpler reading order and stronger teaching cues.",
    icon: BookOpen,
  },
]

const HIGHLIGHTS = [
  "Load a protocol or algorithm directly into the circuit builder.",
  "Read pseudocode beside the circuit while stepping through the gates.",
  "Open the 3D studio in an expanded view for a larger teaching canvas.",
]

export function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: "32px clamp(18px, 4vw, 42px) 40px", maxWidth: 1180, margin: "0 auto" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 20,
          padding: 22,
          borderRadius: "var(--radius-xl)",
          background: "rgba(255,255,255,0.36)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 12 }}>
            QUANTUM PROTOCOL AND ALGORITHM SIMULATOR
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3.4rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              marginBottom: 14,
              color: "var(--text-primary)",
              fontFamily: "var(--font-serif)",
              fontWeight: 600,
            }}
          >
            Learn the idea,
            <br />
            then see the circuit.
          </h1>
          <p style={{ maxWidth: 620, color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7 }}>
            This workspace is designed to make quantum protocols and algorithms easier to grasp. Instead of treating the
            circuit, the math, and the visualization as separate tools, it keeps them side by side so the reasoning
            stays visible while you explore.
          </p>
        </div>

        <div
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "rgba(247,242,232,0.8)",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>WHAT'S NEW IN THE WORKFLOW</div>
          {HIGHLIGHTS.map((line) => (
            <div key={line} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, alignItems: "start" }}>
              <span style={{ color: "var(--accent-cyan)", fontSize: 15, lineHeight: 1 }}>•</span>
              <span style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>{line}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
        {PATHS.map((path) => {
          const Icon = path.icon
          return (
            <button
              key={path.to}
              onClick={() => navigate(path.to)}
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                background: "rgba(251,248,241,0.82)",
                padding: 20,
                textAlign: "left",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minHeight: 210,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--accent-cyan)",
                }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 6 }}>
                  {path.subtitle}
                </div>
                <div style={{ fontSize: 20, lineHeight: 1.15, color: "var(--text-primary)", fontWeight: 700, marginBottom: 8 }}>
                  {path.title}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{path.description}</div>
              </div>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, color: "var(--accent-cyan)", fontSize: 12, fontWeight: 700 }}>
                Open workspace
                <ArrowRight size={14} />
              </div>
            </button>
          )
        })}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <InfoCard
          label="Research focus"
          title="Noise and decoherence"
          text="Use the noise dashboard to compare ideal behaviour against more realistic quantum hardware effects."
        />
        <InfoCard
          label="Scalability"
          title="QDD-backed larger systems"
          text="Move beyond the smallest toy circuits and inspect higher-qubit behaviour with the QDD view when available."
        />
        <InfoCard
          label="Teaching flow"
          title="Circuit, pseudocode, and 3D studio together"
          text="The simulator is now organized around understanding first, so each view explains a different part of the same idea."
        />
      </section>
    </div>
  )
}

function InfoCard({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "rgba(251,248,241,0.72)",
        padding: 18,
      }}
    >
      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{text}</div>
    </div>
  )
}
