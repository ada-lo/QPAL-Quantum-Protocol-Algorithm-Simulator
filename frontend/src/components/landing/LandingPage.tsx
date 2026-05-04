import { SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui"
import { ArrowRight, FlaskConical } from "lucide-react"
import { Link } from "react-router-dom"
import type { CSSProperties } from "react"

import { AppTopNav } from "@/components/shared/AppTopNav"

export function LandingPage() {
  return (
    <div style={pageStyle}>
      <div style={orbNorthStyle} />
      <div style={orbSouthStyle} />

      <AppTopNav title="QPAL" subtitle="Quantum Protocol Algorithm Simulator" links={[{ to: "/docs", label: "Docs" }]} />

      <main style={contentStyle}>
        <section style={heroStyle}>
          <div style={heroTextStyle}>
            <div style={eyebrowStyle}>QUANTUM PROTOCOL WORKSPACE</div>
            <h1 style={heroTitleStyle}>QPAL</h1>
            <p style={taglineStyle}>Simulate, learn and research quantum protocols</p>
            <p style={bodyStyle}>
              Move from concept to circuit in a single dark, focused environment for quantum learning, algorithm exploration, and protocol experimentation.
            </p>

            <div style={ctaRowStyle}>
              <SignedOut>
                <Link to="/login" style={primaryActionStyle}>
                  Start Learning
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" style={secondaryActionStyle}>
                  Open Lab
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/learn" style={primaryActionStyle}>
                  Start Learning
                  <ArrowRight size={16} />
                </Link>
                <Link to="/workspace" style={secondaryActionStyle}>
                  Open Lab
                </Link>
              </SignedIn>
            </div>
          </div>

          <div style={featurePanelStyle}>
            <div style={iconShellStyle}>
              <FlaskConical size={18} />
            </div>
            <div style={eyebrowStyle}>INSIDE THE APP</div>
            <div style={featureListStyle}>
              <div style={featureItemStyle}>Learner tracks for foundations, algorithms, and protocols</div>
              <div style={featureItemStyle}>Researcher workspace with editable circuit templates</div>
              <div style={featureItemStyle}>Topic detail pages backed by Wikipedia and arXiv</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 20,
  position: "relative",
  overflow: "hidden",
}

const orbNorthStyle: CSSProperties = {
  position: "absolute",
  top: -180,
  left: -140,
  width: 520,
  height: 520,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(88, 164, 146, 0.18) 0%, transparent 68%)",
  pointerEvents: "none",
}

const orbSouthStyle: CSSProperties = {
  position: "absolute",
  right: -180,
  bottom: -140,
  width: 540,
  height: 540,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(68, 97, 124, 0.24) 0%, transparent 68%)",
  pointerEvents: "none",
}

const contentStyle: CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "0 auto",
  position: "relative",
  zIndex: 1,
}

const heroStyle: CSSProperties = {
  minHeight: "calc(100vh - 140px)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
  gap: 18,
  alignItems: "center",
}

const heroTextStyle: CSSProperties = {
  borderRadius: "36px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-soft)",
  padding: "34px",
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
  fontSize: "clamp(3.2rem, 8vw, 6rem)",
  lineHeight: 0.96,
  margin: "14px 0 10px",
}

const taglineStyle: CSSProperties = {
  fontSize: 22,
  color: "var(--text-primary)",
  marginBottom: 16,
}

const bodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.85,
  maxWidth: 640,
}

const ctaRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 24,
}

const primaryActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  padding: "14px 18px",
  textDecoration: "none",
  fontWeight: 700,
}

const secondaryActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  padding: "14px 18px",
  textDecoration: "none",
  fontWeight: 700,
}

const featurePanelStyle: CSSProperties = {
  borderRadius: "36px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, rgba(16, 24, 29, 0.92), var(--bg-panel))",
  boxShadow: "var(--shadow-card)",
  padding: 28,
  display: "flex",
  flexDirection: "column",
  gap: 18,
}

const iconShellStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const featureListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const featureItemStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "14px 16px",
  color: "var(--text-secondary)",
  lineHeight: 1.7,
}
