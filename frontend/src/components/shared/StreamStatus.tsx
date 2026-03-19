import { useSimStore } from "@/store/simStore"

export function StreamStatus() {
  const { loading, engineUsed, error } = useSimStore()
  if (error) return (
    <span style={{ fontSize: 12, color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>
      ✗ {error.slice(0, 40)}
    </span>
  )
  if (loading) return (
    <span style={{ fontSize: 12, color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>
      ◌ simulating...
    </span>
  )
  if (engineUsed) return (
    <span style={{ fontSize: 12, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
      ✓ {engineUsed}
    </span>
  )
  return <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>idle</span>
}
