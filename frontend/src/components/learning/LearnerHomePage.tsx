import { useEffect, type CSSProperties } from "react"

import { AppTopNav } from "@/components/shared/AppTopNav"
import { setStoredAppMode } from "@/lib/appMode"
import { TopicTrackSections } from "./TopicTrackSections"

export function LearnerHomePage() {
  useEffect(() => {
    setStoredAppMode("learner")
  }, [])

  return (
    <div style={pageStyle}>
      <AppTopNav title="QPAL Learn" subtitle="Learner Home" links={[{ to: "/mode", label: "Modes" }, { to: "/workspace", label: "Open Lab" }]} />

      <main style={contentStyle}>
        <section style={heroStyle}>
          <div style={eyebrowStyle}>LEARNER MODE</div>
          <h1 style={heroTitleStyle}>Study quantum ideas in tracks that move from foundations to runnable protocols.</h1>
          <p style={heroBodyStyle}>
            Each topic starts with a live summary, then opens a detail page where you can review the concept and load a matching workspace circuit.
          </p>
        </section>

        <TopicTrackSections basePath="/learn" />
      </main>
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 20,
}

const contentStyle: CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 18,
}

const heroStyle: CSSProperties = {
  borderRadius: "32px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: 28,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
}

const heroTitleStyle: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "clamp(2.1rem, 4vw, 3.6rem)",
  margin: "10px 0 12px",
  lineHeight: 1.02,
}

const heroBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.75,
  maxWidth: 760,
}
