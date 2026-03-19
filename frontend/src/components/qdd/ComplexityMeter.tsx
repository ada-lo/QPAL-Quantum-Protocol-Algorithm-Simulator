
interface Props { ratio: number; nodeCount: number; nQubits: number; fullSize: number }

export function ComplexityMeter({ ratio, nodeCount, nQubits, fullSize }: Props) {
  const saved    = (1 - ratio) * 100
  const barColor = ratio < 0.2 ? "var(--accent-green)"
                 : ratio < 0.5 ? "var(--accent-cyan)"
                 : ratio < 0.75 ? "var(--accent-amber)"
                 : "var(--accent-red)"

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
          {nodeCount} nodes
          <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>
            vs {fullSize} (full 2^{nQubits})
          </span>
        </span>
        <span style={{
          fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
          color: barColor,
        }}>
          {saved.toFixed(0)}% saved
        </span>
      </div>
      <div style={{ height: 5, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${saved}%`,
          background: barColor, borderRadius: 3,
          transition: "width 0.5s ease, background 0.3s",
          boxShadow: `0 0 6px ${barColor}66`,
        }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          classical: 2^{nQubits} = {fullSize}
        </span>
        <span style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          QDD: {nodeCount}
        </span>
      </div>
    </div>
  )
}
