import { getLearningExperience } from "@/lib/quantum/learningCatalog"
import { buildCircuitPseudocode, getExperienceBlueprint } from "@/lib/quantum/pseudocode"
import { useLearningStore } from "@/store/learningStore"
import { useCircuitStore } from "@/store/circuitStore"

export function CircuitPseudocodePanel() {
  const selectedId = useLearningStore((s) => s.selectedId)
  const experience = getLearningExperience(selectedId)
  const blueprint = getExperienceBlueprint(experience)
  const { nQubits, initialStates, gates, currentStep } = useCircuitStore()
  const circuitLines = buildCircuitPseudocode(nQubits, initialStates, gates)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-panel)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
          PSEUDOCODE GUIDE
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: experience.accent, marginBottom: 6 }}>{blueprint.title}</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>{blueprint.goal}</div>
      </div>

      <div style={{ padding: "12px 14px", overflow: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <section>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            IDEA
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {blueprint.lines.map((line, index) => (
              <PseudoRow key={line} accent={experience.accent} active={index === Math.min(currentStep, blueprint.lines.length - 1)}>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: 4 }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{line}</div>
              </PseudoRow>
            ))}
          </div>
        </section>

        <section>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            CURRENT CIRCUIT
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {circuitLines.map((line) => {
              const active =
                line.step === -1
                  ? currentStep === 0
                  : line.step === currentStep - 1 || line.step === currentStep

              return (
                <PseudoRow key={`${line.step}-${line.line}`} accent={experience.accent} active={active}>
                  <div style={{ fontSize: 11, lineHeight: 1.6, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginBottom: 5 }}>
                    {line.line}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.55, color: "var(--text-secondary)" }}>{line.detail}</div>
                </PseudoRow>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function PseudoRow({
  children,
  accent,
  active,
}: {
  children: React.ReactNode
  accent: string
  active?: boolean
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${active ? `${accent}44` : "var(--border)"}`,
        background: active ? `${accent}10` : "rgba(255,255,255,0.02)",
      }}
    >
      {children}
    </div>
  )
}
