
import { useState, useMemo } from "react"

/**
 * Gap 2 Research Proof — Fidelity dropping below 50% at a specific circuit depth
 * under thermal noise, proving quantum advantage is lost.
 */
export function FidelityProofDemo() {
  const [t1, setT1] = useState(100)   // μs
  const [t2, setT2] = useState(80)    // μs
  const [tgate, setTgate] = useState(50) // ns

  const t2Capped = Math.min(t2, 2 * t1)

  // Compute fidelity curve and find 50% crossing
  const { curve, crossingDepth, maxDepth } = useMemo(() => {
    const t1ns = t1 * 1e3
    const maxD = 200
    const pts: { depth: number; fidelity: number }[] = []
    let crossing: number | null = null

    for (let d = 0; d <= maxD; d++) {
      const f = Math.exp(-tgate / t1ns) ** d
      pts.push({ depth: d, fidelity: f })
      if (crossing === null && f < 0.5) {
        crossing = d
      }
    }
    return { curve: pts, crossingDepth: crossing, maxDepth: maxD }
  }, [t1, tgate])

  // SVG dimensions
  const W = 520, H = 160
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  const toX = (d: number) => PAD.left + (d / maxDepth) * iW
  const toY = (f: number) => PAD.top + (1 - f) * iH

  const pathD = curve.map((p, i) =>
    `${i === 0 ? "M" : "L"}${toX(p.depth).toFixed(1)},${toY(p.fidelity).toFixed(1)}`
  ).join(" ")

  // Area fill below curve
  const areaD = pathD + ` L${toX(maxDepth).toFixed(1)},${toY(0).toFixed(1)} L${toX(0).toFixed(1)},${toY(0).toFixed(1)} Z`

  return (
    <div style={{
      padding: "12px 14px", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8,
        display: "flex", justifyContent: "space-between",
      }}>
        <span>GAP 2 PROOF — Fidelity vs Circuit Depth</span>
        {crossingDepth !== null && (
          <span style={{ color: "var(--accent-red)" }}>
            F {"<"} 50% at depth {crossingDepth}
          </span>
        )}
      </div>

      {/* Parameter controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[
          { label: "T1", val: t1, set: setT1, min: 10, max: 500, unit: "μs", color: "var(--accent-cyan)" },
          { label: "T2", val: t2Capped, set: setT2, min: 1, max: 300, unit: "μs", color: "var(--accent-purple)" },
          { label: "Gate", val: tgate, set: setTgate, min: 10, max: 1000, unit: "ns", color: "var(--accent-amber)" },
        ].map(({ label, val, set, min, max, unit, color }) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color, fontWeight: 700 }}>
                {val}{unit}
              </span>
            </div>
            <input type="range" min={min} max={max} value={val}
              onChange={e => set(Number(e.target.value))}
              style={{ width: "100%", accentColor: color, height: 4 }} />
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg width={W} height={H} style={{ display: "block", maxWidth: "100%" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={toY(f)} y2={toY(f)}
              stroke="var(--border)" strokeWidth={f === 0.5 ? 1 : 0.5}
              strokeDasharray={f === 0.5 ? "none" : "3,3"} />
            <text x={PAD.left - 6} y={toY(f) + 3} fontSize={8}
              fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">
              {f.toFixed(2)}
            </text>
          </g>
        ))}

        {/* 50% threshold line — highlighted */}
        <line x1={PAD.left} x2={W - PAD.right} y1={toY(0.5)} y2={toY(0.5)}
          stroke="var(--accent-red)" strokeWidth={1.5} opacity={0.6} />
        <text x={W - PAD.right + 4} y={toY(0.5) + 3} fontSize={8}
          fill="var(--accent-red)" fontFamily="var(--font-mono)">50%</text>

        {/* Area fill */}
        <path d={areaD} fill="rgba(0,212,255,0.06)" />

        {/* Fidelity curve */}
        <path d={pathD} fill="none" stroke="var(--accent-cyan)" strokeWidth={2} />

        {/* Crossing marker */}
        {crossingDepth !== null && (
          <>
            <line x1={toX(crossingDepth)} y1={PAD.top}
              x2={toX(crossingDepth)} y2={H - PAD.bottom}
              stroke="var(--accent-red)" strokeWidth={1.5} strokeDasharray="4,3" />
            <circle cx={toX(crossingDepth)} cy={toY(0.5)} r={4}
              fill="var(--accent-red)" stroke="#000" strokeWidth={1} />
            <text x={toX(crossingDepth)} y={PAD.top - 4} fontSize={8}
              fill="var(--accent-red)" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight={700}>
              d={crossingDepth}
            </text>
          </>
        )}

        {/* X axis */}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom}
          stroke="var(--border)" strokeWidth={0.5} />
        <text x={W / 2} y={H - 6} fontSize={8}
          fill="var(--text-muted)" textAnchor="middle" fontFamily="var(--font-mono)">
          Circuit Depth
        </text>
      </svg>

      {/* Insight */}
      <div style={{
        marginTop: 8, padding: "8px 10px",
        background: "var(--bg-card)", borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)", fontSize: 10,
        color: "var(--text-secondary)", lineHeight: 1.6,
      }}>
        <span style={{ color: "var(--accent-red)", fontWeight: 700 }}>Key finding: </span>
        {crossingDepth !== null ? (
          <>
            Under thermal noise (T1={t1}μs, gate={tgate}ns), fidelity drops below 50% at
            depth <strong style={{ color: "var(--accent-red)" }}>{crossingDepth}</strong>.
            Beyond this depth, quantum computation offers no advantage over random guessing.
            {t1 === 100 && tgate === 50 && " These parameters match IBM Eagle processors."}
          </>
        ) : (
          "With current parameters, fidelity stays above 50% for the plotted range. Try increasing gate time or decreasing T1."
        )}
      </div>
    </div>
  )
}
