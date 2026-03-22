import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, Expand, Pause, Play, X } from "lucide-react"
import { LEARNING_EXPERIENCES, getLearningExperience } from "@/lib/quantum/learningCatalog"
import { getLearningSceneProfile } from "@/lib/quantum/learningSceneProfiles"
import { useLearningStore } from "@/store/learningStore"
import { QuantumShowcase3D } from "./QuantumShowcase3D"

export function LearningStudioPanel() {
  const selectedId = useLearningStore((s) => s.selectedId)
  const loadIntoCircuit = useLearningStore((s) => s.loadIntoCircuit)
  const experience = getLearningExperience(selectedId)
  const profile = getLearningSceneProfile(experience.id)
  const [stageIndex, setStageIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setStageIndex(0)
  }, [experience.id])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % profile.stages.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [playing, profile.stages.length])

  useEffect(() => {
    if (!expanded) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [expanded])

  const statusColor =
    experience.support === "implemented"
      ? "var(--accent-green)"
      : experience.support === "demo"
        ? "var(--accent-amber)"
        : "var(--accent-red)"

  const stats = useMemo(
    () => [
      { label: "Mode", value: experience.kind, color: experience.accent },
      { label: "Family", value: profile.family, color: "var(--text-primary)" },
      { label: "Status", value: experience.support, color: statusColor },
    ],
    [experience.accent, experience.kind, experience.support, profile.family, statusColor],
  )

  const activeStage = profile.stages[stageIndex] ?? profile.stages[0]

  return (
    <>
      <StudioSurface
        compact
        experience={experience}
        stageIndex={stageIndex}
        setStageIndex={setStageIndex}
        playing={playing}
        setPlaying={setPlaying}
        loadIntoCircuit={loadIntoCircuit}
        stats={stats}
        onExpand={() => setExpanded(true)}
      />
      {expanded &&
        createPortal(
          <div
            onClick={() => setExpanded(false)}
            style={{
              position: "fixed",
              inset: 18,
              zIndex: 300,
              background: "rgba(32, 25, 15, 0.18)",
              backdropFilter: "blur(8px)",
              display: "grid",
              placeItems: "center",
            }}
          >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1180px, calc(100vw - 48px))",
              height: "min(860px, calc(100vh - 48px))",
              minWidth: 760,
              minHeight: 560,
              resize: "both",
              overflow: "hidden",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              background: "rgba(251,248,241,0.96)",
              boxShadow: "0 24px 60px rgba(58, 49, 35, 0.16)",
            }}
          >
            <StudioSurface
              experience={experience}
              stageIndex={stageIndex}
              setStageIndex={setStageIndex}
              playing={playing}
              setPlaying={setPlaying}
              loadIntoCircuit={loadIntoCircuit}
              stats={stats}
              onClose={() => setExpanded(false)}
            />
          </div>
          </div>,
          document.body,
        )}
    </>
  )
}

function StudioSurface({
  experience,
  stageIndex,
  setStageIndex,
  playing,
  setPlaying,
  loadIntoCircuit,
  stats,
  compact,
  onExpand,
  onClose,
}: {
  experience: ReturnType<typeof getLearningExperience>
  stageIndex: number
  setStageIndex: (value: number | ((current: number) => number)) => void
  playing: boolean
  setPlaying: (value: boolean | ((current: boolean) => boolean)) => void
  loadIntoCircuit: (id: string) => void
  stats: { label: string; value: string; color: string }[]
  compact?: boolean
  onExpand?: () => void
  onClose?: () => void
}) {
  const profile = getLearningSceneProfile(experience.id)
  const activeStage = profile.stages[stageIndex] ?? profile.stages[0]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-panel)" }}>
      <div
        style={{
          padding: compact ? "12px 14px 10px" : "16px 18px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
            STUDIO 3D
          </div>
          <div style={{ fontSize: compact ? 16 : 20, fontWeight: 700, color: experience.accent, marginBottom: 6 }}>
            {experience.label}
          </div>
          <div style={{ fontSize: compact ? 11 : 13, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 760 }}>
            {experience.summary}
          </div>
          {!compact && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
              Drag the lower-right corner to resize this teaching canvas.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {onExpand && (
            <IconButton label="Expand studio" onClick={onExpand}>
              <Expand size={14} />
            </IconButton>
          )}
          {onClose && (
            <IconButton label="Close expanded studio" onClick={onClose}>
              <X size={14} />
            </IconButton>
          )}
          <button
            onClick={() => loadIntoCircuit(experience.id)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              background: `${experience.accent}12`,
              color: experience.accent,
              border: `1px solid ${experience.accent}32`,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Load circuit
          </button>
        </div>
      </div>

      <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEARNING_EXPERIENCES.map((item) => (
          <button
            key={item.id}
            onClick={() => loadIntoCircuit(item.id)}
            style={{
              padding: "4px 9px",
              fontSize: 10,
              borderRadius: 999,
              border: `1px solid ${item.id === experience.id ? `${item.accent}55` : "var(--border)"}`,
              background: item.id === experience.id ? `${item.accent}12` : "transparent",
              color: item.id === experience.id ? item.accent : "var(--text-secondary)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ padding: compact ? "10px 12px 8px" : "12px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>ACTIVE STAGE</div>
            <div style={{ fontSize: compact ? 13 : 15, fontWeight: 700, color: experience.accent }}>{activeStage.title}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <IconButton
              label="Previous stage"
              onClick={() => {
                setPlaying(false)
                setStageIndex((current) => (current - 1 + profile.stages.length) % profile.stages.length)
              }}
            >
              <ChevronLeft size={14} />
            </IconButton>
            <IconButton label={playing ? "Pause autoplay" : "Play autoplay"} onClick={() => setPlaying((current) => !current)}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </IconButton>
            <IconButton
              label="Next stage"
              onClick={() => {
                setPlaying(false)
                setStageIndex((current) => (current + 1) % profile.stages.length)
              }}
            >
              <ChevronRight size={14} />
            </IconButton>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {profile.stages.map((stage, index) => (
            <button
              key={stage.title}
              onClick={() => {
                setPlaying(false)
                setStageIndex(index)
              }}
              style={{
                flex: 1,
                textAlign: "left",
                padding: compact ? "7px 8px" : "8px 10px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${index === stageIndex ? `${experience.accent}55` : "var(--border)"}`,
                background: index === stageIndex ? `${experience.accent}10` : "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: index === stageIndex ? experience.accent : "var(--text-muted)" }}>
                0{index + 1}
              </div>
              <div style={{ fontSize: compact ? 11 : 12, color: index === stageIndex ? "var(--text-primary)" : "var(--text-secondary)", marginTop: 2 }}>
                {stage.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: compact ? 340 : 520, borderBottom: "1px solid var(--border)", background: "#fbf8f1" }}>
        <QuantumShowcase3D experience={experience} stageIndex={stageIndex} expanded={!compact} />
      </div>

      <div style={{ padding: compact ? "12px 14px" : "14px 18px", overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            padding: compact ? "10px 12px" : "12px 14px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${experience.accent}28`,
            background: `${experience.accent}0d`,
          }}
        >
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
            WHAT TO NOTICE NOW
          </div>
          <div style={{ fontSize: compact ? 12 : 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{activeStage.cue}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
          ))}
        </div>

        <div
          style={{
            padding: compact ? "10px 12px" : "12px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            SCENE LEGEND
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {profile.legend.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        padding: "9px 10px",
      }}
    >
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "capitalize" }}>{value}</div>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 34,
        height: 34,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "rgba(251,248,241,0.72)",
        color: "var(--text-secondary)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {children}
    </button>
  )
}
