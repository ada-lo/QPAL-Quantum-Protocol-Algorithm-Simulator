
import { useEffect, useRef } from "react"

/* ─── Quantum Channel ─── */
interface QuantumChannelProps {
  /** Whether a photon is currently flying across */
  sending?: boolean
  /** Color of the photon dot */
  color?: string
  /** Label shown below the channel */
  label?: string
  /** Duration of one crossing in ms */
  durationMs?: number
}

export function QuantumChannel({
  sending = false,
  color = "var(--accent-cyan)",
  label = "quantum channel",
  durationMs = 1200,
}: QuantumChannelProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 4, width: "100%", padding: "8px 0",
    }}>
      <svg width="100%" height={28} viewBox="0 0 140 28" preserveAspectRatio="none">
        {/* Channel wire */}
        <line x1={8} y1={14} x2={132} y2={14}
          stroke="var(--border-bright)" strokeWidth={1.5} />

        {/* Arrow head */}
        <polygon points="130,10 138,14 130,18" fill="var(--border-bright)" />

        {/* Animated photon */}
        {sending && (
          <>
            {/* Glow trail */}
            <circle r={6} fill="none" stroke={color} strokeWidth={1} opacity={0.3}>
              <animate attributeName="cx" from="14" to="128"
                dur={`${durationMs}ms`} repeatCount="indefinite" />
              <animate attributeName="cy" values="14" dur={`${durationMs}ms`}
                repeatCount="indefinite" />
            </circle>
            {/* Core photon */}
            <circle r={3.5} fill={color}>
              <animate attributeName="cx" from="14" to="128"
                dur={`${durationMs}ms`} repeatCount="indefinite" />
              <animate attributeName="cy" values="14" dur={`${durationMs}ms`}
                repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
      <span style={{
        fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: 0.5,
      }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Classical Channel ─── */
interface ClassicalChannelProps {
  /** Whether bits are being sent */
  sending?: boolean
  /** The bit string being sent, e.g. "01" or "+×+×" */
  bits?: string
  /** Color of the bit packet */
  color?: string
  /** Label shown below */
  label?: string
  /** Duration of one crossing in ms */
  durationMs?: number
}

export function ClassicalChannel({
  sending = false,
  bits = "",
  color = "var(--accent-amber)",
  label = "classical channel",
  durationMs = 1400,
}: ClassicalChannelProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 4, width: "100%", padding: "8px 0",
    }}>
      <svg width="100%" height={28} viewBox="0 0 140 28" preserveAspectRatio="none">
        {/* Double dashed line */}
        <line x1={8} y1={11} x2={132} y2={11}
          stroke="var(--border)" strokeWidth={1} strokeDasharray="6,4" />
        <line x1={8} y1={17} x2={132} y2={17}
          stroke="var(--border)" strokeWidth={1} strokeDasharray="6,4" />

        {/* Arrow */}
        <polygon points="130,8 138,14 130,20" fill="var(--border)" />

        {/* Animated bit packet */}
        {sending && bits && (
          <g>
            <rect width={Math.max(22, bits.length * 9 + 8)} height={16} rx={3}
              fill={`color-mix(in srgb, ${color} 20%, transparent)`}
              stroke={color} strokeWidth={1}>
              <animate attributeName="x" from="8" to={128 - bits.length * 9}
                dur={`${durationMs}ms`} repeatCount="indefinite" />
              <animate attributeName="y" values="6" dur={`${durationMs}ms`}
                repeatCount="indefinite" />
            </rect>
            <text fontSize={8} fontFamily="var(--font-mono)" fontWeight={700}
              fill={color} textAnchor="start" dominantBaseline="middle">
              <animate attributeName="x" from="14" to={134 - bits.length * 9}
                dur={`${durationMs}ms`} repeatCount="indefinite" />
              <animate attributeName="y" values="14" dur={`${durationMs}ms`}
                repeatCount="indefinite" />
              {bits}
            </text>
          </g>
        )}
      </svg>
      <span style={{
        fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: 0.5,
      }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Entangled Channel (bidirectional) ─── */
interface EntangledChannelProps {
  active?: boolean
  color?: string
  label?: string
}

export function EntangledChannel({
  active = false,
  color = "var(--accent-purple)",
  label = "entangled pair",
}: EntangledChannelProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 4, width: "100%", padding: "8px 0",
    }}>
      <svg width="100%" height={28} viewBox="0 0 140 28" preserveAspectRatio="none">
        {/* Wavy entanglement line */}
        <path d="M8,14 Q30,4 50,14 Q70,24 90,14 Q110,4 132,14"
          fill="none" stroke={active ? color : "var(--border)"}
          strokeWidth={active ? 2 : 1}
          opacity={active ? 1 : 0.5}>
          {active && (
            <animate attributeName="d"
              values="M8,14 Q30,4 50,14 Q70,24 90,14 Q110,4 132,14;
                      M8,14 Q30,24 50,14 Q70,4 90,14 Q110,24 132,14;
                      M8,14 Q30,4 50,14 Q70,24 90,14 Q110,4 132,14"
              dur="2s" repeatCount="indefinite" />
          )}
        </path>

        {/* Left arrow */}
        <polygon points="12,10 4,14 12,18"
          fill={active ? color : "var(--border)"} opacity={active ? 1 : 0.5} />
        {/* Right arrow */}
        <polygon points="128,10 136,14 128,18"
          fill={active ? color : "var(--border)"} opacity={active ? 1 : 0.5} />
      </svg>
      <span style={{
        fontSize: 8, fontFamily: "var(--font-mono)",
        color: active ? color : "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: 0.5,
      }}>
        {label}
      </span>
    </div>
  )
}
