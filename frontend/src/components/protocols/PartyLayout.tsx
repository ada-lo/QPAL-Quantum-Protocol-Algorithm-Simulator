
import type { ReactNode } from "react"

export interface PartyLayoutProps {
  /** Content for Alice's zone (left) */
  alice: ReactNode
  /** Content for the channel zone (center) */
  channel: ReactNode
  /** Content for Bob's zone (right) */
  bob: ReactNode
  /** Optional Eve row between Alice and channel */
  eve?: ReactNode
  /** Phase banner text */
  phaseBanner?: string
  /** Phase number (0-indexed) */
  phaseNum?: number
  /** Plain-English explanation for current phase */
  explanation?: string
  /** Banner color accent */
  bannerColor?: string
}

/**
 * PartyLayout — Gap 1 foundation
 * Three-zone layout: Alice | Channel | Bob
 * Separates parties spatially, making protocols story-centric instead of circuit-centric.
 */
export function PartyLayout({
  alice, channel, bob, eve,
  phaseBanner, phaseNum, explanation, bannerColor = "var(--accent-cyan)",
}: PartyLayoutProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Phase banner */}
      {phaseBanner && (
        <div style={{
          padding: "10px 16px",
          background: `color-mix(in srgb, ${bannerColor} 8%, transparent)`,
          borderBottom: `2px solid ${bannerColor}`,
          display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0,
        }}>
          {phaseNum !== undefined && (
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: bannerColor, color: "#000",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}>
              {phaseNum}
            </div>
          )}
          <div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: bannerColor,
              fontFamily: "var(--font-mono)", letterSpacing: 0.5,
            }}>
              {phaseBanner}
            </div>
            {explanation && (
              <div style={{
                fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5,
                marginTop: 2,
              }}>
                {explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main 3-zone grid */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: eve ? "1fr 80px 140px 1fr" : "1fr 140px 1fr",
        overflow: "hidden",
      }}>
        {/* Alice zone */}
        <div style={{
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          overflow: "auto", padding: 0,
        }}>
          {alice}
        </div>

        {/* Eve zone (conditional) */}
        {eve && (
          <div style={{
            borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            overflow: "auto",
            background: "rgba(239,68,68,0.03)",
          }}>
            {eve}
          </div>
        )}

        {/* Channel zone */}
        <div style={{
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "var(--bg-panel)",
          overflow: "hidden",
          position: "relative",
        }}>
          {channel}
        </div>

        {/* Bob zone */}
        <div style={{
          display: "flex", flexDirection: "column",
          overflow: "auto", padding: 0,
        }}>
          {bob}
        </div>
      </div>
    </div>
  )
}
