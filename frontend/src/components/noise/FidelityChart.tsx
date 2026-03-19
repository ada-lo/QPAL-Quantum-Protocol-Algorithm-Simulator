
import { useMemo, useState } from "react"
import { useNoise } from "@/hooks/useNoise"
import { useNoiseStore } from "@/store/noiseStore"
import { NOISE_MODELS } from "@/lib/noise/models"

const W = 296, H = 130
const PAD = { top: 16, right: 16, bottom: 28, left: 34 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom
const MAX_DEPTH = 20

function calcFidelity(modelId: string, params: Record<string, number>, depth: number): number {
  if (modelId === "ideal") return 1
  if (modelId === "depolarizing")     return Math.max(0, (1 - (4/3) * (params.p ?? 0.01)) ** depth)
  if (modelId === "amplitude_damping") return Math.max(0, (1 - (params.gamma ?? 0.05)) ** depth)
  if (modelId === "phase_flip")        return Math.max(0, (1 - 2*(params.p ?? 0.02)) ** depth)
  if (modelId === "thermal") {
    const tgate_us = (params.tgate ?? 50) / 1000
    return Math.max(0, Math.exp(-tgate_us / (params.t1 ?? 100)) ** depth)
  }
  return 1
}

function toSVGX(depth: number) { return PAD.left + (depth / MAX_DEPTH) * INNER_W }
function toSVGY(f: number)     { return PAD.top + (1 - f) * INNER_H }

export function FidelityChart() {
  const { model } = useNoise()
  const params = useNoiseStore(s => s.params)
  const [showAll, setShowAll] = useState(false)

  const modelsToShow = showAll
    ? NOISE_MODELS.filter(m => m.id !== "ideal")
    : [model]

  const series = useMemo(() =>
    modelsToShow.map(m => ({
      model: m,
      points: Array.from({ length: MAX_DEPTH + 1 }, (_, d) => ({
        d, f: calcFidelity(m.id, params, d)
      })),
    })),
  [showAll, model.id, params])

  // Find depth where active model hits 50% fidelity
  const halfLife = useMemo(() => {
    for (let d = 0; d <= MAX_DEPTH; d++) {
      if (calcFidelity(model.id, params, d) <= 0.5) return d
    }
    return null
  }, [model.id, params])

  const gridYs = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          FIDELITY DECAY
        </span>
        <button onClick={() => setShowAll(v => !v)} style={{
          fontSize: 10, color: showAll ? "var(--accent-cyan)" : "var(--text-muted)",
          fontFamily: "var(--font-mono)", border: "none", cursor: "pointer",
          padding: "1px 6px", borderRadius: "var(--radius-sm)",
          background: showAll ? "rgba(0,212,255,0.1)" : "transparent",
        }}>
          {showAll ? "single ✕" : "compare all"}
        </button>
      </div>

      <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
        {/* Grid lines */}
        {gridYs.map(f => (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={toSVGY(f)} y2={toSVGY(f)}
              stroke="var(--border)" strokeWidth={f === 0.5 ? 0.8 : 0.4}
              strokeDasharray={f === 0.5 ? "none" : "4,4"}/>
            <text x={PAD.left - 4} y={toSVGY(f) + 4} textAnchor="end"
              fontSize={8} fill="var(--text-muted)" fontFamily="var(--font-mono)">
              {f.toFixed(2)}
            </text>
          </g>
        ))}

        {/* X axis */}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom}
          stroke="var(--border)" strokeWidth={0.5}/>
        {[0, 5, 10, 15, 20].map(d => (
          <text key={d} x={toSVGX(d)} y={H - PAD.bottom + 11} textAnchor="middle"
            fontSize={8} fill="var(--text-muted)" fontFamily="var(--font-mono)">{d}</text>
        ))}
        <text x={W - PAD.right} y={H - PAD.bottom + 22} textAnchor="end"
          fontSize={8} fill="var(--text-muted)">depth</text>

        {/* 50% threshold label */}
        <text x={PAD.left - 4} y={toSVGY(0.5) - 4} textAnchor="end"
          fontSize={8} fill="var(--accent-red)" fontFamily="var(--font-mono)">50%</text>

        {/* Half-life marker */}
        {halfLife !== null && halfLife <= MAX_DEPTH && (
          <g>
            <line x1={toSVGX(halfLife)} y1={PAD.top} x2={toSVGX(halfLife)} y2={H - PAD.bottom}
              stroke="var(--accent-red)" strokeWidth={0.8} strokeDasharray="3,3" opacity={0.7}/>
            <text x={toSVGX(halfLife)} y={PAD.top - 4} textAnchor="middle"
              fontSize={8} fill="var(--accent-red)" fontFamily="var(--font-mono)">
              d={halfLife}
            </text>
          </g>
        )}

        {/* Curves */}
        {series.map(({ model: m, points }) => {
          const path = points.map((p, i) =>
            `${i === 0 ? "M" : "L"}${toSVGX(p.d).toFixed(1)},${toSVGY(p.f).toFixed(1)}`
          ).join(" ")
          const isActive = m.id === model.id
          return (
            <g key={m.id}>
              {/* Area fill for active */}
              {isActive && (
                <path
                  d={path + ` L${toSVGX(MAX_DEPTH)},${toSVGY(0)} L${toSVGX(0)},${toSVGY(0)} Z`}
                  fill={m.color} opacity={0.05}
                />
              )}
              <path d={path} fill="none"
                stroke={m.color}
                strokeWidth={isActive ? 2.5 : 1.2}
                opacity={isActive ? 1 : 0.45}
                strokeLinecap="round" strokeLinejoin="round"/>
              {/* End label for compare mode */}
              {showAll && (
                <text
                  x={toSVGX(MAX_DEPTH) + 3}
                  y={toSVGY(points[MAX_DEPTH].f) + 3}
                  fontSize={8} fill={m.color} fontFamily="var(--font-mono)">
                  {m.id.slice(0, 4)}
                </text>
              )}
            </g>
          )
        })}

        {/* Data point dots on active curve */}
        {series[0]?.points.filter(p => p.d % 5 === 0).map(p => (
          <circle key={p.d}
            cx={toSVGX(p.d)} cy={toSVGY(p.f)} r={2.5}
            fill={series[0].model.color}
            stroke="var(--bg-panel)" strokeWidth={1}/>
        ))}
      </svg>

      {halfLife !== null && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
          Fidelity drops below 50% at depth {halfLife}
        </div>
      )}
    </div>
  )
}
