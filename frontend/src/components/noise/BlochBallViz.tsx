
import { useRef, useEffect, useMemo } from "react"
import { useSimStore } from "@/store/simStore"
import { useNoise } from "@/hooks/useNoise"
import { useNoiseStore } from "@/store/noiseStore"
import { useCircuitStore } from "@/store/circuitStore"

// Analytical purity under each noise model for a single-qubit mixed state
function modelPurity(modelId: string, params: Record<string, number>, depth: number): number {
  if (depth === 0) return 1.0
  if (modelId === "depolarizing") {
    const p = params.p ?? 0.01
    return Math.max(0, (1 - 4*p/3) ** depth)
  }
  if (modelId === "amplitude_damping") {
    const g = params.gamma ?? 0.05
    // Bloch vector shrinks: x,y → (1-g)^(d/2), z → (1-g)^d
    return Math.max(0, (1 - g) ** (depth / 2))
  }
  if (modelId === "phase_flip") {
    const p = params.p ?? 0.02
    return Math.max(0, (1 - 2*p) ** depth)
  }
  if (modelId === "thermal") {
    const t1 = (params.t1 ?? 100) * 1e3   // μs → ns
    const tg = params.tgate ?? 50
    return Math.max(0, Math.exp(-tg / t1) ** depth)
  }
  return 1.0
}

// Canvas-based animated Bloch ball cross-section showing decoherence
export function BlochBallViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>()
  const { model } = useNoise()
  const params    = useNoiseStore(s => s.params)
  const result    = useSimStore(s => s.result)
  const nQubits   = useCircuitStore(s => s.nQubits)
  const depthRef  = useRef(0)
  const dirRef    = useRef(1)

  // Live Bloch vector from simulation result (qubit 0)
  const liveBV = result?.blochVectors?.[0] ?? { x: 0, y: 0, z: 1 }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R  = Math.min(W, H) / 2 - 14

    // Colour helpers
    function hexToRgb(cssVar: string, fallback = "0,212,255") {
      return fallback  // canvas can't read CSS vars; we use direct values
    }

    const colourMap: Record<string, string> = {
      ideal:            "0,212,255",
      depolarizing:     "245,158,11",
      amplitude_damping:"239,68,68",
      phase_flip:       "139,92,246",
      thermal:          "0,212,255",
    }
    const rgb = colourMap[model.id] ?? "0,212,255"

    function draw(depth: number) {
      ctx.clearRect(0, 0, W, H)

      const purity    = modelPurity(model.id, params, Math.round(depth))
      const liveR     = Math.sqrt(liveBV.x**2 + liveBV.y**2 + liveBV.z**2)
      const displayR  = liveR  // actual qubit purity from sim

      // ── Outer ideal sphere ──
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, 2 * Math.PI)
      ctx.strokeStyle = `rgba(30,45,69,1)`
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Equatorial dashes
      ctx.save()
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, 2 * Math.PI)
      ctx.strokeStyle = `rgba(42,63,96,0.6)`
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.restore()

      // ── Axis labels ──
      const labelStyle = "rgba(74,96,128,0.9)"
      ctx.font = "9px JetBrains Mono, monospace"
      ctx.fillStyle = labelStyle
      ctx.textAlign = "center"
      ctx.fillText("|0⟩", cx, cy - R - 5)
      ctx.fillText("|1⟩", cx, cy + R + 12)
      ctx.fillText("+x", cx + R + 12, cy + 3)
      ctx.fillText("-x", cx - R - 12, cy + 3)

      // ── Mixed state Bloch ball (depth-animated) ──
      const animR = R * purity
      if (animR > 2) {
        const grad = ctx.createRadialGradient(cx - animR*0.2, cy - animR*0.3, 0, cx, cy, animR)
        grad.addColorStop(0, `rgba(${rgb},0.25)`)
        grad.addColorStop(0.6, `rgba(${rgb},0.10)`)
        grad.addColorStop(1, `rgba(${rgb},0.03)`)
        ctx.beginPath()
        ctx.arc(cx, cy, animR, 0, 2 * Math.PI)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = `rgba(${rgb},0.4)`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // ── Live Bloch vector from simulation ──
      const bvLen  = displayR * R
      const bvX    = cx + liveBV.x * R
      const bvY    = cy - liveBV.z * R   // z maps to vertical (y-up)
      const bvR    = displayR > 0.95 ? "0,212,255" : displayR > 0.5 ? "245,158,11" : "239,68,68"

      if (bvLen > 4) {
        // Arrow shaft
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(bvX, bvY)
        ctx.strokeStyle = `rgba(${bvR},0.9)`
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.stroke()

        // Arrowhead
        const angle = Math.atan2(bvY - cy, bvX - cx)
        const aLen  = 9
        ctx.beginPath()
        ctx.moveTo(bvX, bvY)
        ctx.lineTo(bvX - aLen * Math.cos(angle - 0.4), bvY - aLen * Math.sin(angle - 0.4))
        ctx.lineTo(bvX - aLen * Math.cos(angle + 0.4), bvY - aLen * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fillStyle = `rgba(${bvR},0.95)`
        ctx.fill()
      }

      // ── Origin dot ──
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(74,96,128,0.7)"
      ctx.fill()

      // ── Purity / depth readout ──
      ctx.font = "10px JetBrains Mono, monospace"
      ctx.textAlign = "left"
      ctx.fillStyle = `rgba(${rgb},0.85)`
      ctx.fillText(`ρ=${purity.toFixed(2)}`, 8, 16)
      ctx.fillStyle = "rgba(74,96,128,0.7)"
      ctx.fillText(`d=${Math.round(depth).toString().padStart(2," ")}`, 8, 28)
    }

    // Animate depth 0→20→0
    function animate() {
      depthRef.current += 0.06 * dirRef.current
      if (depthRef.current >= 20) dirRef.current = -1
      if (depthRef.current <= 0)  dirRef.current =  1
      draw(depthRef.current)
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current!)
  }, [model.id, params, liveBV])

  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
      <div style={{
        fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8,
        display: "flex", justifyContent: "space-between",
      }}>
        <span>BLOCH BALL — decoherence animation</span>
        <span style={{ color: "var(--text-muted)" }}>q0 reduced state</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <canvas ref={canvasRef} width={200} height={200}
          style={{ borderRadius: "var(--radius-md)" }} />
      </div>
      <div style={{
        marginTop: 8, display: "flex", justifyContent: "center", gap: 16,
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
      }}>
        <span>
          <span style={{ color: "var(--accent-green)" }}>●</span> pure
        </span>
        <span>
          <span style={{ color: "var(--accent-amber)" }}>●</span> partial
        </span>
        <span>
          <span style={{ color: "var(--accent-red)" }}>●</span> mixed
        </span>
      </div>
    </div>
  )
}
