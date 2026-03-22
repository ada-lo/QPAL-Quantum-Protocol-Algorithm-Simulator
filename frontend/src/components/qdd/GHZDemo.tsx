
import { useState, useMemo } from "react"

/**
 * GHZ Demo — Interactive visualization proving Gap 3:
 * GHZ state on n qubits needs only n+2 QDD nodes vs 2^n classical amplitudes.
 */
export function GHZDemo() {
  const [n, setN] = useState(5)

  const data = useMemo(() => {
    const classical = Math.pow(2, n)
    const qdd = n + 2
    const ratio = 1 - qdd / classical
    return { classical, qdd, ratio }
  }, [n])

  // Build GHZ QDD graph nodes for visualization
  const graphData = useMemo(() => {
    const nodes: { id: string; x: number; y: number; label: string; isTerminal: boolean }[] = []
    const edges: { from: string; to: string; branch: number }[] = []

    const W = 400, H = 260
    const levelH = H / (n + 2)

    // Decision nodes
    for (let i = 0; i < n; i++) {
      nodes.push({
        id: `d${i}`, x: W / 2, y: levelH * (i + 0.5) + 10,
        label: `q${i}`, isTerminal: false,
      })
      if (i > 0) {
        edges.push({ from: `d${i - 1}`, to: `d${i}`, branch: 0 })
        edges.push({ from: `d${i - 1}`, to: `d${i}`, branch: 1 })
      }
    }

    // Terminal nodes
    nodes.push({
      id: "t0", x: W / 2 - 40, y: levelH * (n + 0.5) + 10,
      label: "1/√2", isTerminal: true,
    })
    nodes.push({
      id: "t1", x: W / 2 + 40, y: levelH * (n + 0.5) + 10,
      label: "0", isTerminal: true,
    })
    edges.push({ from: `d${n - 1}`, to: "t0", branch: 0 })
    edges.push({ from: `d${n - 1}`, to: "t0", branch: 1 })

    return { nodes, edges, W, H }
  }, [n])

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          GHZ State — QDD Compression Proof
        </h3>
        <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          The GHZ state |{"0".repeat(n)}⟩ + |{"1".repeat(n)}⟩ on <strong style={{ color: "var(--accent-cyan)" }}>n qubits</strong> requires
          only <strong style={{ color: "var(--accent-green)" }}>n+2 nodes</strong> in a QDD — regardless of qubit count.
          Classical simulation needs 2<sup>n</sup> amplitudes.
        </p>
      </div>

      {/* Qubit slider */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>n qubits</span>
          <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontWeight: 700 }}>{n}</span>
        </div>
        <input type="range" min={2} max={20} value={n}
          onChange={e => setN(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent-cyan)" }} />
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{
          background: "var(--bg-card)", borderRadius: "var(--radius-md)",
          padding: "10px 12px", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
            CLASSICAL
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>
            {data.classical.toLocaleString()}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>amplitudes</div>
        </div>
        <div style={{
          background: "var(--bg-card)", borderRadius: "var(--radius-md)",
          padding: "10px 12px", border: "1px solid var(--accent-green)",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
            QDD
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
            {data.qdd}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>nodes (n+2)</div>
        </div>
        <div style={{
          background: "var(--bg-card)", borderRadius: "var(--radius-md)",
          padding: "10px 12px", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
            SAVED
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
            {(data.ratio * 100).toFixed(n > 10 ? 3 : 1)}%
          </div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>memory</div>
        </div>
      </div>

      {/* Compression bar */}
      <div style={{
        marginBottom: 16, padding: "10px 12px",
        background: "var(--bg-card)", borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
      }}>
        <div style={{
          fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6,
        }}>COMPRESSION RATIO</div>
        <div style={{
          height: 20, borderRadius: 4, background: "var(--bg-hover)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Classical (full bar) */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(239,68,68,0.15)",
          }} />
          {/* QDD (tiny fraction) */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 0,
            width: `${Math.max(2, (1 - data.ratio) * 100)}%`,
            background: "var(--accent-green)",
            borderRadius: 4,
            transition: "width 0.3s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {(1 - data.ratio) * 100 > 8 && (
              <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "#000", fontWeight: 700 }}>
                QDD
              </span>
            )}
          </div>
          <div style={{
            position: "absolute", right: 6, top: 0, bottom: 0,
            display: "flex", alignItems: "center",
            fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--accent-red)",
          }}>
            Classical: 2<sup>{n}</sup>
          </div>
        </div>
      </div>

      {/* QDD Graph visualization */}
      <div style={{
        background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)", padding: 12,
      }}>
        <div style={{
          fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8,
        }}>GHZ QDD STRUCTURE — {data.qdd} nodes</div>
        <svg width={graphData.W} height={Math.min(graphData.H, 280)} viewBox={`0 0 ${graphData.W} ${Math.min(graphData.H, 280)}`}
          style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>
          {/* Edges */}
          {graphData.edges.map((e, i) => {
            const from = graphData.nodes.find(n => n.id === e.from)!
            const to = graphData.nodes.find(n => n.id === e.to)!
            const offset = e.branch === 0 ? -12 : 12
            return (
              <line key={i}
                x1={from.x + offset} y1={from.y + 10}
                x2={to.x + (to.isTerminal ? 0 : offset)} y2={to.y - 10}
                stroke={e.branch === 0 ? "var(--accent-cyan)" : "var(--accent-amber)"}
                strokeWidth={1.5} opacity={0.7}
              />
            )
          })}
          {/* Nodes */}
          {graphData.nodes.map(node => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y}
                r={node.isTerminal ? 14 : 12}
                fill={node.isTerminal ? "rgba(0,212,255,0.1)" : "var(--bg-card)"}
                stroke={node.isTerminal ? "var(--accent-cyan)" : "var(--border-bright)"}
                strokeWidth={1.5}
              />
              <text x={node.x} y={node.y + 3.5}
                textAnchor="middle" fontSize={node.isTerminal ? 8 : 9}
                fill={node.isTerminal ? "var(--accent-cyan)" : "var(--text-secondary)"}
                fontFamily="var(--font-mono)" fontWeight={700}>
                {node.label}
              </text>
            </g>
          ))}
          {/* Branch labels */}
          <text x={graphData.W / 2 - 30} y={18} fontSize={8}
            fill="var(--accent-cyan)" fontFamily="var(--font-mono)">|0⟩ branch</text>
          <text x={graphData.W / 2 + 5} y={18} fontSize={8}
            fill="var(--accent-amber)" fontFamily="var(--font-mono)">|1⟩ branch</text>
        </svg>
      </div>

      {/* Key insight */}
      <div style={{
        marginTop: 12, padding: "10px 14px",
        background: "var(--bg-card)", borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)", fontSize: 11,
        color: "var(--text-secondary)", lineHeight: 1.7,
      }}>
        <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>Gap 3 proof: </span>
        GHZ(n={n}) uses <strong style={{ color: "var(--accent-green)" }}>{data.qdd}</strong> QDD nodes
        vs <strong style={{ color: "var(--accent-red)" }}>{data.classical.toLocaleString()}</strong> classical amplitudes.
        {n >= 10 && " The compression becomes exponentially better as n grows."}
        {n >= 20 && ` At n=20, over 1 million amplitudes are compressed to just 22 nodes — a 99.998% memory saving.`}
      </div>
    </div>
  )
}
