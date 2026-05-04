import { UserButton } from "@neondatabase/neon-js/auth/react/ui"
import { ArrowRight, Atom, ChevronLeft, CircuitBoard, FlaskConical, MoonStar, Orbit, PlaySquare, SlidersHorizontal, SunMedium } from "lucide-react"
import { useEffect } from "react"
import { Link, Navigate, useParams } from "react-router-dom"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { LearningStudioPanel } from "@/components/learning/LearningStudioPanel"
import { useThemeMode } from "@/hooks/useThemeMode"
import { getLearnerTopicConfig, isLearnerKind } from "@/lib/learning/learnerFlow"
import { useLearningStore } from "@/store/learningStore"

const ACTION_CARDS = [
  {
    id: "inputs",
    title: "Try with Inputs",
    description: "Open a guided lab with inputs or defaults prepared for this lesson.",
    icon: <SlidersHorizontal size={16} />,
  },
  {
    id: "circuit",
    title: "Load Circuit",
    description: "Open the simplified lab with the relevant circuit already loaded.",
    icon: <CircuitBoard size={16} />,
  },
  {
    id: "lab",
    title: "Try Lab",
    description: "Open the full learner lab shell for hands-on exploration without researcher-only surfaces.",
    icon: <FlaskConical size={16} />,
  },
] as const

export function LearnerLessonPage() {
  const { kind, topic } = useParams()
  const { theme, setTheme } = useThemeMode()
  const selectLearningExperience = useLearningStore((s) => s.select)

  if (!isLearnerKind(kind) || !topic) {
    return <Navigate to="/learn/protocol" replace />
  }

  const topicConfig = getLearnerTopicConfig(topic)
  if (!topicConfig || topicConfig.kind !== kind) {
    return <Navigate to={`/learn/${kind}`} replace />
  }

  useEffect(() => {
    selectLearningExperience(topicConfig.experienceId)
  }, [selectLearningExperience, topicConfig.experienceId])

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link to={`/learn/${kind}`} style={backButtonStyle}>
            <ChevronLeft size={14} />
            Back to {kind}
          </Link>
          <div style={brandStyle}>
            <div style={brandMarkStyle}><Atom size={16} /></div>
            <div>
              <div style={eyebrowStyle}>LEARN</div>
              <div style={{ fontWeight: 700 }}>{topicConfig.title}</div>
            </div>
          </div>
        </div>

        <div style={headerActionsStyle}>
          <ThemeToggleButton label="Dark" active={theme === "dark"} icon={<MoonStar size={14} />} onClick={() => setTheme("dark")} />
          <ThemeToggleButton label="Light" active={theme === "light"} icon={<SunMedium size={14} />} onClick={() => setTheme("light")} />
          <Link to="/app/mode" style={secondaryActionStyle}>Modes</Link>
          <SignOutButton style={secondaryActionStyle} />
          <div style={userButtonShellStyle}><UserButton /></div>
        </div>
      </header>

      <main style={contentStyle}>
        <section style={heroPanelStyle}>
          <div style={eyebrowStyle}>{topicConfig.kind.toUpperCase()} LESSON</div>
          <h1 style={heroTitleStyle}>{topicConfig.title}</h1>
          <p style={heroBodyStyle}>{topicConfig.summary}</p>
          <div style={heroPillRowStyle}>
            <span style={pillStyle}>Learn</span>
            <span style={pillStyle}>Guided lab</span>
            <span style={pillStyle}>{topicConfig.apiCapabilities.simulate ? "Simulation enabled" : "Read-only"}</span>
            {topicConfig.hasGuidedInputs && <span style={pillStyle}>Guided inputs</span>}
          </div>
        </section>

        <section style={storyGridStyle}>
          <div style={storyPanelStyle}>
            <div style={eyebrowStyle}>LEARN</div>
            <h2 style={sectionTitleStyle}>What to watch for</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topicConfig.story.map((line, index) => (
                <div key={line} style={storyCardStyle}>
                  <div style={storyIndexStyle}>0{index + 1}</div>
                  <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{line}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={studioPanelStyle}>
            <LearningStudioPanel />
          </div>
        </section>

        <section style={actionSectionStyle}>
          <div style={eyebrowStyle}>NEXT STEP</div>
          <h2 style={sectionTitleStyle}>Choose how you want to practice this lesson.</h2>
          <div style={actionGridStyle}>
            {ACTION_CARDS.map((action) => (
              <article key={action.id} style={actionCardStyle}>
                <div style={actionIconStyle}>{action.icon}</div>
                <h3 style={{ margin: 0, fontSize: 18 }}>{action.title}</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{action.description}</p>
                <Link to={`/learn/${kind}/${topic}/lab?action=${action.id}`} style={primaryActionStyle}>
                  {action.id === "lab" ? "Open learner lab" : action.title}
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function ThemeToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} style={{ ...themeToggleStyle, borderColor: active ? "var(--accent-cyan)" : "var(--border)", background: active ? "var(--bg-active)" : "var(--bg-card)" }}>
      {icon}
      {label}
    </button>
  )
}

const pageStyle = { minHeight: "100vh", padding: 20 } as const
const headerStyle = { width: "min(1180px, 100%)", margin: "0 auto 20px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" } as const
const brandStyle = { display: "inline-flex", alignItems: "center", gap: 12 } as const
const brandMarkStyle = { width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--bg-panel)", color: "var(--accent-cyan)" } as const
const eyebrowStyle = { fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" } as const
const headerActionsStyle = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } as const
const themeToggleStyle = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)", padding: "10px 12px", display: "inline-flex", alignItems: "center", gap: 8 } as const
const secondaryActionStyle = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", padding: "10px 14px", textDecoration: "none", fontWeight: 700 } as const
const backButtonStyle = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", padding: "10px 14px", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 } as const
const userButtonShellStyle = { display: "inline-flex", alignItems: "center" } as const
const contentStyle = { width: "min(1180px, 100%)", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 } as const
const heroPanelStyle = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))", padding: 24 } as const
const heroTitleStyle = { fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 3.2rem)", margin: "8px 0 12px" } as const
const heroBodyStyle = { color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 760 } as const
const heroPillRowStyle = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 } as const
const pillStyle = { padding: "6px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-active)", fontSize: 12, fontFamily: "var(--font-mono)" } as const
const storyGridStyle = { display: "grid", gridTemplateColumns: "minmax(320px, 0.9fr) minmax(0, 1.1fr)", gap: 18, alignItems: "start" } as const
const storyPanelStyle = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "var(--bg-panel)", padding: 20, display: "flex", flexDirection: "column", gap: 14 } as const
const sectionTitleStyle = { fontSize: 24, margin: 0 } as const
const storyCardStyle = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-active)", padding: "12px 14px", display: "flex", gap: 12 } as const
const storyIndexStyle = { width: 34, height: 34, borderRadius: 10, background: "var(--bg-card)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", flexShrink: 0 } as const
const studioPanelStyle = { minWidth: 0 } as const
const actionSectionStyle = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "var(--bg-panel)", padding: 20, display: "flex", flexDirection: "column", gap: 16 } as const
const actionGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 } as const
const actionCardStyle = { borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--bg-active)", padding: 18, display: "flex", flexDirection: "column", gap: 12 } as const
const actionIconStyle = { width: 36, height: 36, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card)", color: "var(--accent-cyan)" } as const
const primaryActionStyle = { marginTop: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-cyan)", background: "var(--accent-cyan)", color: "var(--button-primary-text)", padding: "12px 16px", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start" } as const
