import { useSimStore } from "@/store/simStore"

export function StreamStatus() {
  const { loading, engineUsed, error } = useSimStore()

  const tone = error
    ? { label: error.slice(0, 42), color: "var(--accent-red)", bg: "rgba(183,90,69,0.12)" }
    : loading
      ? { label: "Simulating", color: "var(--accent-amber)", bg: "rgba(156,107,36,0.12)" }
      : engineUsed
        ? { label: engineUsed, color: "var(--accent-green)", bg: "rgba(79,123,74,0.12)" }
        : { label: "Idle", color: "var(--text-muted)", bg: "rgba(95,107,100,0.08)" }

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: tone.bg,
        fontSize: 11,
        color: tone.color,
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
      }}
    >
      {tone.label}
    </div>
  )
}
