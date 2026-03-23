import { getLearningExperience } from "@/lib/quantum/learningCatalog"
import { useLearningStore } from "@/store/learningStore"
import { useCircuitStore } from "@/store/circuitStore"

export function CircuitLessonBanner() {
  const selectedId = useLearningStore((s) => s.selectedId)
  const experience = getLearningExperience(selectedId)
  const gates = useCircuitStore((s) => s.gates)
  const currentStep = useCircuitStore((s) => s.currentStep)

  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 12,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>GUIDED BUILD</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: experience.accent,
              padding: "2px 6px",
              borderRadius: 999,
              background: `${experience.accent}14`,
              border: `1px solid ${experience.accent}32`,
              textTransform: "uppercase",
            }}
          >
            {experience.kind}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: experience.accent, marginBottom: 4 }}>{experience.label}</div>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-secondary)" }}>{experience.summary}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {experience.story.map((line, index) => {
          const active = Math.min(currentStep, experience.story.length - 1) === index && gates.length > 0
          return (
            <div
              key={`${experience.id}-${index}`}
              style={{
                padding: "7px 9px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${active ? `${experience.accent}36` : "var(--border)"}`,
                background: active ? `${experience.accent}10` : "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: active ? experience.accent : "var(--text-muted)", marginBottom: 3 }}>
                STAGE {index + 1}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.45, color: "var(--text-secondary)" }}>{line}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
