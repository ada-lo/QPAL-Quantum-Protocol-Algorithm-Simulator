
import { useMemo, useState } from "react"
import { useSimStore } from "@/store/simStore"
import { useCircuitStore } from "@/store/circuitStore"
import { compressionRatio, syntheticQDD, type QDDGraph } from "@/lib/qdd/graph"
import { layoutQDD } from "@/lib/qdd/layout"
import { QDDNodeViz } from "./QDDNodeViz"
import { ComplexityMeter } from "./ComplexityMeter"

type DemoType = "bell" | "ghz" | "grover" | "random"

const DEMOS: { id: DemoType; label: string; desc: string }[] = [
  { id: "bell",   label: "Bell",   desc: "2 qubits — perfect compression" },
  { id: "ghz",    label: "GHZ",    desc: "n qubits — linear nodes" },
  { id: "grover", label: "Grover", desc: "partial compression" },
  { id: "random", label: "Random", desc: "typical circuit" },
]

export function QDDGraphView() {
  const result     = useSimStore(s => s.result)
  const nQubits    = useCircuitStore(s => s.nQubits)
  const backendGraph = result?.qddGraph as QDDGraph | undefined

  const [demoType, setDemoType]   = useState<DemoType>("ghz")
  const [demoQubits, setDemoQubits] = useState(8)
  const [showWeights, setShowWeights] = useState(true)

  // Use backend graph if available (after simulation of 7+ qubit circuit),
  // otherwise show interactive demo
  const graph: QDDGraph = useMemo(() => {
    if (backendGraph && backendGraph.nQubits > 6) return backendGraph
    return syntheticQDD(demoQubits, demoType)
  }, [backendGraph, demoType, demoQubits])

  const layout = useMemo(() => layoutQDD(graph, 296, 70), [graph])
  const ratio  = compressionRatio(graph)
  const posMap = new Map(layout.nodes.map(n => [n.id, { x: n.x, y: n.y }]))

  const isLive = !!(backendGraph && backendGraph.nQubits > 6)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
        padding: "8px 12px 6px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>QUANTUM DECISION DIAGRAM — Gap 3</span>
        {isLive && (
          <span style={{
            fontSize: 9, color: "var(--accent-green)", padding: "1px 6px",
            background: "rgba(16,185,129,0.1)", borderRadius: 3,
            border: "1px solid rgba(16,185,129,0.3)",
          }}>● LIVE {graph.nQubits}q</span>
        )}
      </div>

      {/* Demo controls (shown when no live graph) */}
      {!isLive && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>
            DEMO — simulate a 7+ qubit circuit to see live QDD
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {DEMOS.map(d => (
              <button key={d.id} onClick={() => setDemoType(d.id)} title={d.desc} style={{
                padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: 10,
                background: demoType === d.id ? "var(--accent-purple)" : "var(--bg-card)",
                color: demoType === d.id ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${demoType === d.id ? "var(--accent-purple)" : "var(--border)"}`,
                cursor: "pointer",
              }}>{d.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              n = {demoQubits} qubits
            </span>
            <input type="range" min={2} max={20} value={demoQubits}
              onChange={e => setDemoQubits(Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--accent-purple)" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={showWeights} onChange={e => setShowWeights(e.target.checked)}
                style={{ accentColor: "var(--accent-cyan)" }}/>
              weights
            </label>
          </div>
        </div>
      )}

      {/* Compression meter */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <ComplexityMeter ratio={ratio} nodeCount={graph.nodeCount} nQubits={graph.nQubits} fullSize={graph.fullSize} />
      </div>

      {/* Graph SVG */}
      <div style={{ flex: 1, overflow: "auto", padding: 4 }}>
        <svg
          width={layout.width}
          height={Math.max(layout.height, 200)}
          style={{ display: "block", minWidth: "100%" }}
        >
          {/* Level labels */}
          {Array.from(new Set(layout.nodes.map(n => n.level))).map(lvl => {
            const nodes = layout.nodes.filter(n => n.level === lvl)
            if (nodes.length === 0) return null
            const y = nodes[0].y
            const isTerminal = nodes[0].isTerminal
            return (
              <text key={lvl} x={6} y={y + 4} fontSize={8}
                fill="var(--text-muted)" fontFamily="var(--font-mono)">
                {isTerminal ? "leaf" : `q${lvl}`}
              </text>
            )
          })}

          {/* Edges */}
          {layout.edges.map((e, i) => {
            const from = posMap.get(e.from)
            const to   = posMap.get(e.to)
            if (!from || !to) return null
            const isZero = e.branch === 0
            const mag    = Math.sqrt(e.weight.re**2 + e.weight.im**2)
            const sw     = Math.max(0.8, mag * 3)
            const midX   = (from.x + to.x) / 2
            const midY   = (from.y + to.y) / 2
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y + 12}
                  x2={to.x}   y2={to.y - (to.isTerminal ? 10 : 12)}
                  stroke={isZero ? "var(--accent-blue)" : "var(--accent-cyan)"}
                  strokeWidth={sw}
                  strokeDasharray={isZero ? "4,2" : "none"}
                  opacity={0.75}
                />
                {showWeights && mag > 0.05 && (
                  <text
                    x={midX + (isZero ? -10 : 10)}
                    y={midY}
                    fontSize={7} fontFamily="var(--font-mono)"
                    fill={isZero ? "var(--accent-blue)" : "var(--accent-cyan)"}
                    textAnchor="middle" opacity={0.8}
                  >
                    {mag.toFixed(2)}
                  </text>
                )}
                {/* Branch label near source */}
                <text
                  x={from.x + (isZero ? -8 : 8)}
                  y={from.y + 20}
                  fontSize={7} fontFamily="var(--font-mono)"
                  fill={isZero ? "var(--accent-blue)" : "var(--accent-cyan)"}
                  textAnchor="middle" opacity={0.6}
                >
                  |{e.branch}⟩
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {layout.nodes.map(n => (
            <QDDNodeViz key={n.id} node={n} x={n.x} y={n.y} />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        padding: "6px 12px", borderTop: "1px solid var(--border)",
        display: "flex", gap: 14, flexShrink: 0, flexWrap: "wrap",
      }}>
        {[
          { color: "var(--accent-blue)",   dash: true,  label: "|0⟩ branch" },
          { color: "var(--accent-cyan)",   dash: false, label: "|1⟩ branch" },
          { color: "var(--accent-purple)", dash: false, label: "decision node" },
          { color: "var(--accent-green)",  dash: false, label: "terminal" },
        ].map(({ color, dash, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width={18} height={8}>
              <line x1={0} y1={4} x2={18} y2={4}
                stroke={color} strokeWidth={1.5}
                strokeDasharray={dash ? "3,2" : "none"}/>
            </svg>
            <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
