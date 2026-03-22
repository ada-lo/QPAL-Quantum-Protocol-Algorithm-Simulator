import { LEARNING_EXPERIENCES, getLearningExperience } from "@/lib/quantum/learningCatalog"
import { useLearningStore } from "@/store/learningStore"
import { QuantumShowcase3D } from "./QuantumShowcase3D"

export function LearningStudioPanel() {
  const selectedId = useLearningStore((s) => s.selectedId)
  const loadIntoCircuit = useLearningStore((s) => s.loadIntoCircuit)
  const experience = getLearningExperience(selectedId)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-panel)" }}>
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>LEARNING STUDIO</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: experience.accent }}>{experience.label}</div>
        </div>
        <button
          onClick={() => loadIntoCircuit(experience.id)}
          style={{
            padding: "5px 10px",
            borderRadius: "var(--radius-sm)",
            background: `${experience.accent}18`,
            color: experience.accent,
            border: `1px solid ${experience.accent}40`,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Reload Circuit
        </button>
      </div>

      <div style={{ padding: 10, borderBottom: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEARNING_EXPERIENCES.map((item) => (
          <button
            key={item.id}
            onClick={() => loadIntoCircuit(item.id)}
            style={{
              padding: "4px 9px",
              fontSize: 10,
              borderRadius: 999,
              border: `1px solid ${item.id === experience.id ? `${item.accent}55` : "var(--border)"}`,
              background: item.id === experience.id ? `${item.accent}12` : "transparent",
              color: item.id === experience.id ? item.accent : "var(--text-secondary)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ height: 290, borderBottom: "1px solid var(--border)" }}>
        <QuantumShowcase3D experience={experience} />
      </div>

      <div style={{ padding: "12px 14px", overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border)",
          }}
        >
          {experience.summary}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <StatCard label="Type" value={experience.kind} color={experience.accent} />
          <StatCard label="Qubits" value={`${experience.nQubits}`} color="var(--text-primary)" />
          <StatCard
            label="Runtime status"
            value={experience.support}
            color={
              experience.support === "implemented"
                ? "var(--accent-green)"
                : experience.support === "demo"
                  ? "var(--accent-amber)"
                  : "var(--accent-red)"
            }
          />
        </div>

        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            FLOW
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {experience.story.map((line, index) => (
              <div
                key={`${experience.id}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "22px 1fr",
                  gap: 10,
                  alignItems: "start",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: `${experience.accent}18`,
                    border: `1px solid ${experience.accent}40`,
                    color: experience.accent,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.55, color: "var(--text-secondary)" }}>{line}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        padding: "9px 10px",
      }}
    >
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "capitalize" }}>{value}</div>
    </div>
  )
}
