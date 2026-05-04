import { FlaskConical, GraduationCap } from "lucide-react"
import type { CSSProperties } from "react"
import { useNavigate } from "react-router-dom"

import { AppTopNav } from "@/components/shared/AppTopNav"
import { setStoredAppMode, type AppMode } from "@/lib/appMode"

export function AppModePage() {
  const navigate = useNavigate()

  function handleSelect(mode: AppMode) {
    setStoredAppMode(mode)
    navigate(mode === "learner" ? "/learn" : "/workspace")
  }

  return (
    <div style={pageStyle}>
      <AppTopNav title="QPAL Mode" subtitle="Choose Your Flow" links={[{ to: "/learn", label: "Learn" }, { to: "/workspace", label: "Workspace" }]} />

      <main style={contentStyle}>
        <section style={introStyle}>
          <div style={eyebrowStyle}>MODE SELECTION</div>
          <h1 style={titleStyle}>Pick how you want to use QPAL right now.</h1>
          <p style={bodyStyle}>
            Learner mode opens the guided track browser. Researcher mode takes you straight into the existing workspace.
          </p>
        </section>

        <section style={gridStyle}>
          <button type="button" onClick={() => handleSelect("learner")} style={cardStyle}>
            <div style={iconStyle}>
              <GraduationCap size={18} />
            </div>
            <div style={eyebrowStyle}>LEARNER</div>
            <h2 style={cardTitleStyle}>Start with guided topic tracks.</h2>
            <p style={cardBodyStyle}>
              Explore foundations, algorithms, and protocols with summaries first, then open topic detail pages and load matching circuits.
            </p>
          </button>

          <button type="button" onClick={() => handleSelect("researcher")} style={cardStyle}>
            <div style={iconStyle}>
              <FlaskConical size={18} />
            </div>
            <div style={eyebrowStyle}>RESEARCHER</div>
            <h2 style={cardTitleStyle}>Go directly to the lab.</h2>
            <p style={cardBodyStyle}>
              Enter the full workspace immediately, then use the explore catalog for technical topic pages and related paper lookups.
            </p>
          </button>
        </section>
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

const introStyle: CSSProperties = {
  borderRadius: "32px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: 28,
  boxShadow: "var(--shadow-card)",
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
}

const titleStyle: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
  margin: "10px 0 12px",
}

const bodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.75,
  maxWidth: 760,
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
}

const cardStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-card))",
  padding: 24,
  boxShadow: "var(--shadow-card)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  textAlign: "left",
}

const iconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const cardTitleStyle: CSSProperties = {
  fontSize: 24,
}

const cardBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.75,
}
