
import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import { BlochScene } from "./BlochScene"
import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore } from "@/store/simStore"

export function BlochSphere() {
  const nQubits = useCircuitStore(s => s.nQubits)
  const result = useSimStore(s => s.result)
  const count = Math.min(nQubits, 4)
  const cols = count > 2 ? 2 : count

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-panel)" }}>
      <div style={{
        fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
        padding: "8px 12px 4px", borderBottom: "1px solid var(--border)",
      }}>
        BLOCH SPHERES ΓÇö reduced single-qubit states
      </div>
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 0,
      }}>
        {Array.from({ length: count }, (_, i) => {
          const bv = result?.blochVectors?.[i] ?? { x: 0, y: 0, z: 1 }
          const purity = Math.sqrt(bv.x**2 + bv.y**2 + bv.z**2)
          return (
            <div key={i} style={{
              position: "relative", minHeight: 120,
              borderRight: (i+1) % cols !== 0 ? "1px solid var(--border)" : "none",
              borderBottom: i < count - cols ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                position: "absolute", top: 6, left: 8, zIndex: 1,
                fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
              }}>
                q{i}
                <span style={{
                  marginLeft: 6,
                  color: purity > 0.95 ? "var(--accent-green)" : purity > 0.5 ? "var(--accent-amber)" : "var(--accent-red)",
                }}>
                  {(purity * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{
                position: "absolute", bottom: 6, left: 0, right: 0, zIndex: 1,
                display: "flex", justifyContent: "center", gap: 8,
                fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
              }}>
                <span>x={bv.x.toFixed(2)}</span>
                <span>y={bv.y.toFixed(2)}</span>
                <span>z={bv.z.toFixed(2)}</span>
              </div>
              <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }} style={{ height: "100%" }}>
                <Suspense fallback={null}>
                  <BlochScene bv={bv} />
                  <OrbitControls enableZoom={false} enablePan={false}
                    autoRotate autoRotateSpeed={0.4} />
                </Suspense>
              </Canvas>
            </div>
          )
        })}
      </div>
    </div>
  )
}
