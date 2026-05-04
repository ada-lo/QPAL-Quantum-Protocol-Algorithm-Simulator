import { UserButton } from "@neondatabase/neon-js/auth/react/ui"
import { ArrowRight, Atom, BookOpenText, ChevronLeft, MoonStar, Orbit, SunMedium } from "lucide-react"
import { useMemo } from "react"
import { Link, Navigate, useParams } from "react-router-dom"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { useThemeMode } from "@/hooks/useThemeMode"
import { getLearnerTopicsByKind, isLearnerKind } from "@/lib/learning/learnerFlow"

export function LearnerTopicIndexPage() {
  const { kind } = useParams()
  const { theme, setTheme } = useThemeMode()

  if (!isLearnerKind(kind)) {
    return <Navigate to="/learn/protocol" replace />
  }

  const topics = useMemo(() => getLearnerTopicsByKind(kind), [kind])

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link to="/app/mode" style={backButtonStyle}>
            <ChevronLeft size={14} />
            Back to mode picker
          </Link>
          <div style={brandStyle}>
            <div style={brandMarkStyle}><Atom size={16} /></div>
            <div>
              <div style={eyebrowStyle}>LEARNER FLOW</div>
              <div style={{ fontWeight: 700 }}>Choose a {kind} topic.</div>
            </div>
          </div>
        </div>

        <div style={headerActionsStyle}>
          <ThemeToggleButton label="Dark" active={theme === "dark"} icon={<MoonStar size={14} />} onClick={() => setTheme("dark")} />
          <ThemeToggleButton label="Light" active={theme === "light"} icon={<SunMedium size={14} />} onClick={() => setTheme("light")} />
          <Link to="/docs" style={secondaryActionStyle}>Docs</Link>
          <SignOutButton style={secondaryActionStyle} />
          <div style={userButtonShellStyle}><UserButton /></div>
        </div>
      </header>

      <main style={contentStyle}>
        <div style={tabRailStyle}>
          <Link to="/learn/protocol" style={{ ...tabStyle, ...(kind === "protocol" ? activeTabStyle : null) }}>
            <Orbit size={14} />
            Protocols
          </Link>
          <Link to="/learn/algorithm" style={{ ...tabStyle, ...(kind === "algorithm" ? activeTabStyle : null) }}>
            <BookOpenText size={14} />
            Algorithms
          </Link>
        </div>

        <section style={introPanelStyle}>
          <div style={eyebrowStyle}>{kind.toUpperCase()} TOPICS</div>
          <h1 style={heroTitleStyle}>{kind === "protocol" ? "Start with communication and security flows." : "Start with core algorithm lessons."}</h1>
          <p style={heroBodyStyle}>
            Pick a topic to review the narrative, inspect the 3D studio, and then move into a simplified lab with only the controls that matter for that lesson.
          </p>
        </section>

        <section style={gridStyle}>
          {topics.map((topic) => (
            <article key={topic.topicId} style={cardStyle}>
              <div style={eyebrowStyle}>{topic.kind}</div>
              <h2 style={cardTitleStyle}>{topic.title}</h2>
              <p style={cardBodyStyle}>{topic.summary}</p>
              <div style={storyListStyle}>
                {topic.story.slice(0, 2).map((line) => (
                  <div key={line} style={storyItemStyle}>{line}</div>
                ))}
              </div>
              <Link to={`/learn/${topic.kind}/${topic.topicId}`} style={primaryActionStyle}>
                Open lesson
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
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
const tabRailStyle = { display: "flex", gap: 8, flexWrap: "wrap" } as const
const tabStyle = { borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", fontWeight: 700 } as const
const activeTabStyle = { color: "var(--text-primary)", borderColor: "var(--accent-cyan)", background: "var(--bg-active)" } as const
const introPanelStyle = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))", padding: 24 } as const
const heroTitleStyle = { fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 3.2rem)", margin: "8px 0 12px" } as const
const heroBodyStyle = { color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 760 } as const
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 } as const
const cardStyle = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "var(--bg-panel)", padding: 20, display: "flex", flexDirection: "column", gap: 12 } as const
const cardTitleStyle = { fontSize: 22, margin: 0 } as const
const cardBodyStyle = { color: "var(--text-secondary)", lineHeight: 1.7 } as const
const storyListStyle = { display: "flex", flexDirection: "column", gap: 8 } as const
const storyItemStyle = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-active)", padding: "10px 12px", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 } as const
const primaryActionStyle = { marginTop: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-cyan)", background: "var(--accent-cyan)", color: "var(--button-primary-text)", padding: "12px 16px", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start" } as const
