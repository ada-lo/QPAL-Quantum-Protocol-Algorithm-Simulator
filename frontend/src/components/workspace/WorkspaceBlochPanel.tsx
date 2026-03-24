import { Suspense, type CSSProperties } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

import { BlochScene } from "@/components/bloch/BlochScene"
import type { WorkspaceBlochVector } from "@/lib/workspace/types"

export function WorkspaceBlochPanel({ blochVectors }: { blochVectors: WorkspaceBlochVector[] }) {
  if (!blochVectors.length) {
    return (
      <div style={emptyStateStyle}>
        Run a valid program to inspect single-qubit Bloch vectors.
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
      {blochVectors.map((vector) => {
        const purity = vector.purity ?? Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2)
        const purityColor = purity >= 0.95 ? "var(--accent-green, #4ade80)" : purity >= 0.4 ? "var(--accent-amber, #fbbf24)" : "var(--accent-red, #f87171)"
        return (
          <div
            key={vector.qubit}
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              overflow: "hidden",
              minHeight: 260,
            }}
          >
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
                BLOCH VECTOR
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <strong style={{ fontSize: 16, color: "var(--text-primary)" }}>{vector.qubit}</strong>
                <span style={{
                  fontSize: 11,
                  color: purityColor,
                  fontFamily: "var(--font-mono)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: `color-mix(in srgb, ${purityColor} 15%, transparent)`,
                  fontWeight: 600,
                }}>
                  {purity >= 0.95 ? "pure" : purity >= 0.4 ? "mixed" : "max-mixed"} {(purity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div style={{ height: 190 }}>
              <Canvas camera={{ position: [0, 0, 2.9], fov: 42 }}>
                <Suspense fallback={null}>
                  <BlochScene bv={{ x: vector.x, y: vector.y, z: vector.z }} />
                  <OrbitControls enablePan={false} enableZoom minDistance={1.8} maxDistance={5.5} autoRotate autoRotateSpeed={0.35} />
                </Suspense>
              </Canvas>
            </div>
            <div style={{ padding: "10px 14px 14px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <div>x={vector.x.toFixed(2)}</div>
              <div>y={vector.y.toFixed(2)}</div>
              <div>z={vector.z.toFixed(2)}</div>
              <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 10 }}>Scroll or pinch to zoom.</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const emptyStateStyle: CSSProperties = {
  minHeight: 220,
  display: "grid",
  placeItems: "center",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
}
