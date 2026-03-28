import { ArrowLeft } from "lucide-react"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Link } from "react-router-dom"

import { fetchWorkspaceCatalog } from "@/lib/workspace/api"
import type { WorkspaceCatalogResponse } from "@/lib/workspace/types"

export function WorkspaceDocsPage() {
  const [catalog, setCatalog] = useState<WorkspaceCatalogResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadCatalog() {
      try {
        const response = await fetchWorkspaceCatalog()
        if (!active) return
        setCatalog(response)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load catalog.")
      }
    }
    void loadCatalog()
    return () => {
      active = false
    }
  }, [])

  const algorithms = useMemo(() => (catalog?.templates ?? []).filter((template) => template.kind === "algorithm"), [catalog?.templates])
  const protocols = useMemo(() => (catalog?.templates ?? []).filter((template) => template.kind === "protocol"), [catalog?.templates])

  return (
    <div style={docsShellStyle}>
      <header style={docsHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>QPAL DOCS</div>
          <h1 style={{ fontSize: "clamp(1.6rem, 2.2vw, 2.2rem)" }}>Algorithms and Protocols</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 6 }}>
            Full descriptions of available algorithm and protocol templates.
          </p>
        </div>
        <Link to="/" style={backButtonStyle}>
          <ArrowLeft size={14} />
          Back to workspace
        </Link>
      </header>

      {error && <div style={noticeStyle}>{error}</div>}

      <section style={docsSectionStyle}>
        <h2 style={sectionTitleStyle}>Algorithms</h2>
        <div style={cardGridStyle}>
          {algorithms.map((template) => (
            <article key={template.id} style={docCardStyle}>
              <div style={eyebrowStyle}>Algorithm</div>
              <h3 style={{ fontSize: 18 }}>{template.title}</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>{template.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={docsSectionStyle}>
        <h2 style={sectionTitleStyle}>Protocols</h2>
        <div style={cardGridStyle}>
          {protocols.map((template) => (
            <article key={template.id} style={docCardStyle}>
              <div style={eyebrowStyle}>Protocol</div>
              <h3 style={{ fontSize: 18 }}>{template.title}</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>{template.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

const docsShellStyle: CSSProperties = {
  minHeight: "100%",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 18,
}

const docsHeaderStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: "18px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
}

const docsSectionStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: "16px",
}

const sectionTitleStyle: CSSProperties = {
  marginBottom: 14,
  fontSize: 20,
}

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
}

const docCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "8px 12px",
  color: "var(--text-primary)",
  textDecoration: "none",
}

const noticeStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--accent-red)",
  color: "var(--accent-red)",
  background: "var(--bg-card)",
  padding: "10px 12px",
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: 8,
}
