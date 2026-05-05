import { FlaskConical } from "lucide-react"
import { useEffect } from "react"
import { Link } from "react-router-dom"

import { AppTopNav } from "@/components/shared/AppTopNav"
import { setStoredAppMode } from "@/lib/appMode"
import { getTopicTracks } from "@/lib/learning/topicCatalog"
import { TopicTrackSections } from "./TopicTrackSections"

export function ResearcherExplorePage() {
  const tracks = getTopicTracks()

  useEffect(() => {
    setStoredAppMode("researcher")
  }, [])

  return (
    <div style={{ minHeight: "100vh", padding: 20 }}>
      <AppTopNav title="QPAL Explore" subtitle="Researcher Catalog" links={[{ to: "/workspace", label: "Workspace" }, { to: "/mode", label: "Modes" }]} />
      <main style={contentStyle}>
        <section style={heroStyle}>
          <div style={iconStyle}>
            <FlaskConical size={18} />
          </div>
          <div>
            <div style={eyebrowStyle}>RESEARCHER MODE</div>
            <h1 style={titleStyle}>Browse the same topic grid with technical detail pages and paper lookups.</h1>
            <p style={bodyStyle}>
              Open any topic to read the local technical description, inspect related arXiv papers, and send the mapped circuit directly into the workspace.
            </p>
          </div>
          <Link to="/workspace" style={actionStyle}>
            Open workspace
          </Link>
        </section>
        <div style={jumpRailStyle}>
          <a href="#algorithms" style={jumpChipStyle}>
            Algorithms
          </a>
          <a href="#protocols" style={jumpChipStyle}>
            Protocols
          </a>
        </div>
        <div style={categoryGridStyle}>
          {tracks.map((track) => (
            <a key={track.id} href={`#${track.id}`} style={categoryCardStyle}>
              <div style={eyebrowStyle}>{track.id.toUpperCase()}</div>
              <div style={categoryTitleStyle}>{track.title}</div>
              <div style={categoryBodyStyle}>
                {track.topics.length} topics grouped under {track.id}.
              </div>
            </a>
          ))}
        </div>
        <TopicTrackSections basePath="/explore" />
      </main>
    </div>
  )
}

const pageStyle = {
  padding: "20px 20px 0",
}

const contentStyle = {
  width: "min(1180px, 100%)",
  margin: "0 auto",
}

const heroStyle = {
  borderRadius: "32px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: 24,
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gap: 16,
  alignItems: "center",
}

const iconStyle = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const eyebrowStyle = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
}

const titleStyle = {
  fontSize: "clamp(1.8rem, 3.2vw, 3rem)",
  fontFamily: "var(--font-serif)",
  margin: "8px 0 10px",
}

const bodyStyle = {
  color: "var(--text-secondary)",
  lineHeight: 1.7,
}

const actionStyle = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  padding: "12px 16px",
  textDecoration: "none",
  fontWeight: 700,
}

const jumpRailStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  margin: "18px 0 24px",
}

const categoryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
  marginBottom: 24,
}

const categoryCardStyle = {
  borderRadius: "20px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-card))",
  boxShadow: "var(--shadow-card)",
  padding: 18,
  textDecoration: "none",
  color: "inherit",
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
}

const categoryTitleStyle = {
  fontSize: 20,
  fontWeight: 700,
}

const categoryBodyStyle = {
  color: "var(--text-secondary)",
  lineHeight: 1.6,
}

const jumpChipStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  color: "var(--text-primary)",
  textDecoration: "none",
  fontWeight: 700,
}
