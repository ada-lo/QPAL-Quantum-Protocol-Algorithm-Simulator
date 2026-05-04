import { useEffect, useState, type CSSProperties } from "react"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { fetchWikipediaSummary } from "@/lib/api/externalApis"
import { getTopicTracks, type TopicCatalogEntry } from "@/lib/learning/topicCatalog"

interface TopicTrackSectionsProps {
  basePath: "/learn" | "/explore"
}

interface TopicPreviewState {
  [key: string]: string
}

export function TopicTrackSections({ basePath }: TopicTrackSectionsProps) {
  const tracks = getTopicTracks()
  const [descriptions, setDescriptions] = useState<TopicPreviewState>({})

  useEffect(() => {
    let active = true

    async function loadDescriptions(topic: TopicCatalogEntry) {
      const summary = await fetchWikipediaSummary(topic.wikipedia_query, topic.fallback_description)
      if (!active) return
      setDescriptions((current) => ({ ...current, [topic.id]: summary.extract }))
    }

    tracks.flatMap((track) => track.topics).forEach((topic) => {
      void loadDescriptions(topic)
    })

    return () => {
      active = false
    }
  }, [tracks])

  return (
    <>
      {tracks.map((track) => (
        <section key={track.id} style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={eyebrowStyle}>{track.id.toUpperCase()}</div>
            <h2 style={sectionTitleStyle}>{track.title}</h2>
          </div>

          <div style={gridStyle}>
            {track.topics.map((topic) => (
              <article key={topic.id} style={cardStyle}>
                <div style={eyebrowStyle}>{topic.complexity}</div>
                <h3 style={cardTitleStyle}>{topic.name}</h3>
                <p style={cardBodyStyle}>{descriptions[topic.id] ?? "Loading summary..."}</p>
                <Link to={`${basePath}/${topic.id}`} style={cardActionStyle}>
                  Open topic
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
}

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 26,
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
}

const cardStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-card))",
  boxShadow: "var(--shadow-card)",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 420,
}

const cardTitleStyle: CSSProperties = {
  fontSize: 21,
  lineHeight: 1.2,
  minHeight: 50,
}

const cardBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  display: "-webkit-box",
  WebkitLineClamp: 8,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  minHeight: 190,
  maxHeight: 190,
  position: "relative",
}

const cardActionStyle: CSSProperties = {
  marginTop: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  alignSelf: "flex-start",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  padding: "12px 16px",
  textDecoration: "none",
  fontWeight: 700,
}
