import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { ArrowRight, ArrowUpRight, BookOpenText, ExternalLink, FlaskConical } from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { AppTopNav } from "@/components/shared/AppTopNav"
import { fetchArxivPapers, fetchWikipediaSummary, type ArxivPaper, type WikipediaSummary } from "@/lib/api/externalApis"
import { setStoredAppMode } from "@/lib/appMode"
import { getTopicById, getTopicLabel } from "@/lib/learning/topicCatalog"
import { fetchPublicWorkspaceCatalog } from "@/lib/workspace/api"
import type { WorkspaceTemplate } from "@/lib/workspace/types"

interface TopicDetailPageProps {
  mode: "learner" | "researcher"
}

export function TopicDetailPage({ mode }: TopicDetailPageProps) {
  const { topic: topicId } = useParams()
  const navigate = useNavigate()
  const topic = topicId ? getTopicById(topicId) : null
  const [summary, setSummary] = useState<WikipediaSummary | null>(null)
  const [papers, setPapers] = useState<ArxivPaper[]>([])
  const [paperError, setPaperError] = useState<string | null>(null)
  const [paperLoading, setPaperLoading] = useState(false)
  const [showAllPapers, setShowAllPapers] = useState(false)
  const [template, setTemplate] = useState<WorkspaceTemplate | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  useEffect(() => {
    setStoredAppMode(mode)
  }, [mode])

  useEffect(() => {
    if (!topic) return
    let active = true

    async function loadSummary() {
      const nextSummary = await fetchWikipediaSummary(topic.wikipedia_query, topic.fallback_description)
      if (active) setSummary(nextSummary)
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [topic])

  useEffect(() => {
    if (!topic || mode !== "learner") return
    let active = true
    setTemplateLoading(true)
    setTemplateError(null)

    async function loadTemplate() {
      try {
        const catalog = await fetchPublicWorkspaceCatalog()
        if (!active) return
        const nextTemplate = catalog.templates.find((item) => item.id === topic.catalog_key) ?? null
        setTemplate(nextTemplate)
        if (!nextTemplate) {
          setTemplateError("No workspace template preview was found for this topic.")
        }
      } catch (error) {
        if (!active) return
        setTemplateError(error instanceof Error ? error.message : "Unable to load circuit preview.")
      } finally {
        if (active) setTemplateLoading(false)
      }
    }

    void loadTemplate()

    return () => {
      active = false
    }
  }, [mode, topic])

  useEffect(() => {
    if (!topic || mode !== "researcher") return
    let active = true
    setPaperLoading(true)
    setPaperError(null)

    async function loadPapers() {
      try {
        const nextPapers = await fetchArxivPapers(topic.arxiv_query)
        if (!active) return
        setPapers(nextPapers)
      } catch (error) {
        if (!active) return
        setPaperError(error instanceof Error ? error.message : "Unable to load related papers.")
      } finally {
        if (active) setPaperLoading(false)
      }
    }

    void loadPapers()

    return () => {
      active = false
    }
  }, [mode, topic])

  const backPath = mode === "learner" ? "/learn" : "/explore"
  const workspaceButtonLabel = mode === "learner" ? "Load Circuit" : "Load in Workspace"
  const technicalSummary = useMemo(() => topic?.fallback_description ?? "", [topic])
  const visiblePapers = showAllPapers ? papers : papers.slice(0, 3)

  if (!topic) {
    return <Navigate to={backPath} replace />
  }

  function handleLoadCircuit() {
    navigate(`/workspace?template=${encodeURIComponent(topic.catalog_key)}`)
  }

  return (
    <div style={pageStyle}>
      <AppTopNav
        title={mode === "learner" ? "QPAL Learn" : "QPAL Explore"}
        subtitle={topic.name}
        links={[
          { to: backPath, label: mode === "learner" ? "Back to tracks" : "Back to catalog" },
          { to: "/workspace", label: "Workspace" },
        ]}
      />

      <main style={contentStyle}>
        <section style={heroStyle}>
          <div style={mode === "learner" ? learnIconStyle : researchIconStyle}>
            {mode === "learner" ? <BookOpenText size={18} /> : <FlaskConical size={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={eyebrowStyle}>{mode === "learner" ? "LEARNER DETAIL" : "RESEARCHER DETAIL"}</div>
            <h1 style={titleStyle}>{topic.name}</h1>
            <p style={bodyStyle}>
              {mode === "learner" ? summary?.extract ?? topic.fallback_description : technicalSummary}
            </p>
            <div style={pillRowStyle}>
              <span style={pillStyle}>{topic.complexity}</span>
              <span style={pillStyle}>Catalog key: {topic.catalog_key}</span>
            </div>
          </div>
          {mode === "researcher" && (
            <button type="button" onClick={handleLoadCircuit} style={actionButtonStyle}>
              {workspaceButtonLabel}
            </button>
          )}
        </section>

        {mode === "learner" ? (
          <>
            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={eyebrowStyle}>WIKIPEDIA SUMMARY</div>
                  <h2 style={panelTitleStyle}>Topic overview</h2>
                </div>
                {summary?.contentUrl && (
                  <a href={summary.contentUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                    View source
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <p style={panelBodyStyle}>{summary?.extract ?? topic.fallback_description}</p>
            </section>

            <section style={panelStyle}>
              <div style={eyebrowStyle}>HOW IT WORKS</div>
              <h2 style={panelTitleStyle}>Step-by-step breakdown</h2>
              <div style={stepGridStyle}>
                {topic.steps.map((step, index) => (
                  <article key={`${topic.id}-step-${index}`} style={stepCardStyle}>
                    <div style={stepNumberStyle}>{index + 1}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h3 style={stepTitleStyle}>{step.title}</h3>
                      <p style={stepBodyStyle}>{step.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <div style={eyebrowStyle}>KEY CONCEPTS</div>
              <h2 style={panelTitleStyle}>What you should know first</h2>
              <div style={prerequisiteGridStyle}>
                {topic.prerequisites.map((prerequisiteId) => (
                  <Link key={prerequisiteId} to={`/learn/${prerequisiteId}`} style={prerequisiteCardStyle}>
                    <span>{getTopicLabel(prerequisiteId)}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <div style={eyebrowStyle}>CIRCUIT PREVIEW</div>
              <h2 style={panelTitleStyle}>Read-only template</h2>
              {templateLoading ? (
                <div style={codeSkeletonShellStyle}>
                  <div style={codeSkeletonLineLongStyle} />
                  <div style={codeSkeletonLineMidStyle} />
                  <div style={codeSkeletonLineLongStyle} />
                  <div style={codeSkeletonLineShortStyle} />
                  <div style={codeSkeletonLineMidStyle} />
                </div>
              ) : template ? (
                <pre style={codeBlockStyle}>{template.code}</pre>
              ) : (
                <div style={noticeStyle}>{templateError ?? "Unable to load circuit preview."}</div>
              )}
              {!templateLoading && templateError && !template && <div style={mutedTextStyle}>{templateError}</div>}
              <button type="button" onClick={handleLoadCircuit} style={actionButtonStyle}>
                {workspaceButtonLabel}
              </button>
            </section>

            <section style={panelStyle}>
              <div style={eyebrowStyle}>GO DEEPER</div>
              <h2 style={panelTitleStyle}>Keep exploring</h2>
              <div style={deeperGridStyle}>
                <a href={summary?.contentUrl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.wikipedia_query)}`} target="_blank" rel="noreferrer" style={deeperLinkCardStyle}>
                  <div style={eyebrowStyle}>REFERENCE</div>
                  <div style={deeperLinkTitleStyle}>Read full Wikipedia article</div>
                  <span style={linkStyle}>
                    Open article
                    <ArrowUpRight size={14} />
                  </span>
                </a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`qpal ${topic.name} quantum`)}`} target="_blank" rel="noreferrer" style={deeperLinkCardStyle}>
                  <div style={eyebrowStyle}>VIDEO</div>
                  <div style={deeperLinkTitleStyle}>Watch on YouTube</div>
                  <span style={linkStyle}>
                    Search videos
                    <ArrowUpRight size={14} />
                  </span>
                </a>
              </div>
            </section>
          </>
        ) : (
          <>
            <section style={panelStyle}>
              <div style={eyebrowStyle}>TECHNICAL DESCRIPTION</div>
              <h2 style={panelTitleStyle}>Local research note</h2>
              <p style={panelBodyStyle}>{technicalSummary}</p>
            </section>

            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={eyebrowStyle}>ARXIV</div>
                  <h2 style={panelTitleStyle}>Related papers</h2>
                </div>
                {paperLoading && <div style={mutedTextStyle}>Loading papers...</div>}
              </div>
              {paperError && <div style={noticeStyle}>{paperError}</div>}
              <div style={paperGridStyle}>
                {visiblePapers.map((paper) => (
                  <article key={paper.id} style={paperCardStyle}>
                    <div style={eyebrowStyle}>{paper.published ? new Date(paper.published).getFullYear() : "arXiv"}</div>
                    <h3 style={paperTitleStyle}>{paper.title}</h3>
                    <div style={authorStyle}>{paper.authors.join(", ")}</div>
                    <p style={paperSummaryStyle}>
                      {paper.summary}
                    </p>
                    <a href={paper.link} target="_blank" rel="noreferrer" style={linkStyle}>
                      Read paper
                      <ArrowUpRight size={14} />
                    </a>
                  </article>
                ))}
              </div>
              {papers.length > 3 && !showAllPapers && (
                <button type="button" onClick={() => setShowAllPapers(true)} style={showMoreButtonStyle}>
                  Show more
                </button>
              )}
              {!paperLoading && !paperError && papers.length === 0 && (
                <div style={mutedTextStyle}>No related papers were returned for this topic.</div>
              )}
            </section>
          </>
        )}
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
  padding: 26,
  display: "flex",
  gap: 18,
  alignItems: "flex-start",
  flexWrap: "wrap",
}

const learnIconStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const researchIconStyle: CSSProperties = {
  ...learnIconStyle,
  color: "var(--accent-amber)",
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
  fontSize: "clamp(2rem, 4vw, 3.4rem)",
  margin: "10px 0 12px",
}

const bodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.8,
  maxWidth: 760,
}

const pillRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 16,
}

const pillStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-active)",
  fontSize: 12,
  fontFamily: "var(--font-mono)",
}

const actionButtonStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  padding: "12px 16px",
  fontWeight: 700,
}

const panelStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 16,
}

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
}

const panelTitleStyle: CSSProperties = {
  fontSize: 24,
}

const panelBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.8,
}

const stepGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
}

const stepCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 18,
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
}

const stepNumberStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  flexShrink: 0,
}

const stepTitleStyle: CSSProperties = {
  fontSize: 17,
}

const stepBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.7,
}

const prerequisiteGridStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
}

const prerequisiteCardStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  textDecoration: "none",
  fontWeight: 600,
}

const codeBlockStyle: CSSProperties = {
  margin: 0,
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-code)",
  color: "var(--text-primary)",
  padding: 18,
  whiteSpace: "pre-wrap",
  overflowX: "auto",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  lineHeight: 1.65,
  minHeight: 220,
}

const codeSkeletonShellStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-code)",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minHeight: 220,
}

const codeSkeletonBaseStyle: CSSProperties = {
  height: 12,
  borderRadius: 999,
  background: "linear-gradient(90deg, var(--bg-active), var(--bg-card), var(--bg-active))",
}

const codeSkeletonLineLongStyle: CSSProperties = {
  ...codeSkeletonBaseStyle,
  width: "88%",
}

const codeSkeletonLineMidStyle: CSSProperties = {
  ...codeSkeletonBaseStyle,
  width: "62%",
}

const codeSkeletonLineShortStyle: CSSProperties = {
  ...codeSkeletonBaseStyle,
  width: "38%",
}

const deeperGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
}

const deeperLinkCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  textDecoration: "none",
}

const deeperLinkTitleStyle: CSSProperties = {
  fontSize: 18,
  color: "var(--text-primary)",
}

const paperGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
}

const paperCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const paperTitleStyle: CSSProperties = {
  fontSize: 18,
}

const authorStyle: CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: 13,
}

const paperSummaryStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}

const linkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "var(--accent-cyan)",
  textDecoration: "none",
  fontWeight: 700,
}

const mutedTextStyle: CSSProperties = {
  color: "var(--text-secondary)",
}

const noticeStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-amber)",
  background: "var(--bg-card)",
  color: "var(--accent-amber)",
  padding: "10px 12px",
}

const showMoreButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  padding: "10px 14px",
  fontWeight: 700,
}
