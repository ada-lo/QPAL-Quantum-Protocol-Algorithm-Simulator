
import { NoiseModelSelector } from "./NoiseModelSelector"
import { DecoherencePanel } from "./DecoherencePanel"
import { FidelityChart } from "./FidelityChart"
import { BlochBallViz } from "./BlochBallViz"
import { useNoise } from "@/hooks/useNoise"

export function NoiseDashboard() {
  const { activeModel } = useNoise()
  const isNoisy = activeModel !== "ideal"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
      <div style={{
        fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
        padding: "8px 14px 6px", borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        NOISE & DECOHERENCE — Gap 2
      </div>

      <NoiseModelSelector />

      {isNoisy ? (
        <>
          <BlochBallViz />
          <DecoherencePanel />
          <FidelityChart />
        </>
      ) : (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 12, padding: 24, color: "var(--text-muted)",
        }}>
          <svg width={48} height={48} viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-bright)" strokeWidth="1.5"/>
            <circle cx="24" cy="24" r="14" fill="none" stroke="var(--border)" strokeWidth="1"/>
            <line x1="24" y1="4" x2="24" y2="44" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3,3"/>
            <line x1="4" y1="24" x2="44" y2="24" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3,3"/>
            <line x1="24" y1="4" x2="24" y2="24" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#a)"/>
            <defs><marker id="a" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-cyan)"/>
            </marker></defs>
          </svg>
          <div style={{ fontSize: 12, textAlign: "center", lineHeight: 1.6, maxWidth: 200 }}>
            Select a noise model above to visualize decoherence effects on your circuit
          </div>
        </div>
      )}
    </div>
  )
}
