
import { useRef, useEffect } from "react"
import { useNoise } from "@/hooks/useNoise"
import { useNoiseStore } from "@/store/noiseStore"

/**
 * Side-by-side Bloch sphere comparison — Ideal vs Noisy
 * Gap 2 research demo showing how noise degrades quantum states
 */

// Analytical purity under each noise model
function modelPurity(modelId: string, params: Record<string, number>, depth: number): number {
  if (depth === 0) return 1.0
  if (modelId === "depolarizing") {
    const p = params.p ?? 0.01
    return Math.max(0, (1 - 4*p/3) ** depth)
  }
  if (modelId === "amplitude_damping") {
    const g = params.gamma ?? 0.05
    return Math.max(0, (1 - g) ** (depth / 2))
  }
  if (modelId === "phase_flip") {
    const p = params.p ?? 0.02
    return Math.max(0, (1 - 2*p) ** depth)
  }
  if (modelId === "thermal") {
    const t1 = (params.t1 ?? 100) * 1e3
    const tg = params.tgate ?? 50
    return Math.max(0, Math.exp(-tg / t1) ** depth)
  }
  return 1.0
}

function drawBlochBall(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, R: number,
  purity: number, rgb: string, label: string, depth: number
) {
  const W = R * 2 + 28

  // Outer ideal sphere
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.strokeStyle = "rgba(30,45,69,1)"
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Equatorial dashes
  ctx.save()
  ctx.setLineDash([4, 6])
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.strokeStyle = "rgba(42,63,96,0.6)"
  ctx.lineWidth = 0.8
  ctx.stroke()
  ctx.restore()

  // Axis
  ctx.strokeStyle = "rgba(42,63,96,0.4)"
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(cx, cy - R)
  ctx.lineTo(cx, cy + R)
  ctx.moveTo(cx - R, cy)
  ctx.lineTo(cx + R, cy)
  ctx.stroke()

  // Labels
  ctx.font = "8px JetBrains Mono, monospace"
  ctx.fillStyle = "rgba(74,96,128,0.9)"
  ctx.textAlign = "center"
  ctx.fillText("|0⟩", cx, cy - R - 4)
  ctx.fillText("|1⟩", cx, cy + R + 10)

  // Mixed state ball
  const animR = R * purity
  if (animR > 1) {
    const grad = ctx.createRadialGradient(cx - animR*0.2, cy - animR*0.3, 0, cx, cy, animR)
    grad.addColorStop(0, `rgba(${rgb},0.3)`)
    grad.addColorStop(0.6, `rgba(${rgb},0.12)`)
    grad.addColorStop(1, `rgba(${rgb},0.04)`)
    ctx.beginPath()
    ctx.arc(cx, cy, animR, 0, 2 * Math.PI)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = `rgba(${rgb},0.5)`
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Bloch vector (pointing up for |0⟩ state)
  const bvLen = R * purity
  const bvX = cx
  const bvY = cy - bvLen
  const bvR = purity > 0.95 ? "0,212,255" : purity > 0.5 ? "245,158,11" : "239,68,68"

  if (bvLen > 3) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(bvX, bvY)
    ctx.strokeStyle = `rgba(${bvR},0.9)`
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.stroke()

    // Arrowhead
    const angle = -Math.PI / 2
    const aLen = 8
    ctx.beginPath()
    ctx.moveTo(bvX, bvY)
    ctx.lineTo(bvX - aLen * Math.cos(angle - 0.4), bvY - aLen * Math.sin(angle - 0.4))
    ctx.lineTo(bvX - aLen * Math.cos(angle + 0.4), bvY - aLen * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fillStyle = `rgba(${bvR},0.95)`
    ctx.fill()
  }

  // Origin dot
  ctx.beginPath()
  ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI)
  ctx.fillStyle = "rgba(74,96,128,0.7)"
  ctx.fill()

  // Readout
  ctx.font = "10px JetBrains Mono, monospace"
  ctx.textAlign = "center"
  ctx.fillStyle = `rgba(${rgb},0.9)`
  ctx.fillText(label, cx, cy + R + 24)
  ctx.fillStyle = "rgba(74,96,128,0.8)"
  ctx.fillText(`ρ=${purity.toFixed(2)}`, cx, cy + R + 36)
}

export function BlochComparison() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const depthRef = useRef(0)
  const dirRef = useRef(1)
  const { model } = useNoise()
  const params = useNoiseStore(s => s.params)
  const activeModel = useNoiseStore(s => s.activeModel)
  const isNoisy = activeModel !== "ideal"

  const colourMap: Record<string, string> = {
    ideal:            "0,212,255",
    depolarizing:     "245,158,11",
    amplitude_damping:"239,68,68",
    phase_flip:       "139,92,246",
    thermal:          "0,212,255",
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    const R = 60

    const rgb = colourMap[model.id] ?? "0,212,255"

    function draw(depth: number) {
      ctx.clearRect(0, 0, W, H)

      const d = Math.round(depth)
      const idealPurity = 1.0
      const noisyPurity = isNoisy ? modelPurity(model.id, params, d) : 1.0

      // Left: Ideal
      drawBlochBall(ctx, W / 4, H / 2 - 10, R, idealPurity, "0,212,255", "IDEAL", 0)

      // Arrow between
      ctx.font = "18px sans-serif"
      ctx.fillStyle = "rgba(74,96,128,0.5)"
      ctx.textAlign = "center"
      ctx.fillText("→", W / 2, H / 2 - 10)

      // Right: Noisy
      drawBlochBall(ctx, W * 3 / 4, H / 2 - 10, R, noisyPurity, rgb, isNoisy ? model.label.toUpperCase() : "IDEAL", d)

      // Depth indicator at bottom
      ctx.font = "9px JetBrains Mono, monospace"
      ctx.fillStyle = "rgba(74,96,128,0.7)"
      ctx.textAlign = "center"
      ctx.fillText(`depth = ${d}`, W / 2, H - 6)
    }

    function animate() {
      depthRef.current += 0.08 * dirRef.current
      if (depthRef.current >= 30) dirRef.current = -1
      if (depthRef.current <= 0) dirRef.current = 1
      draw(depthRef.current)
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current!)
  }, [model.id, params, isNoisy])

  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
      <div style={{
        fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8,
        display: "flex", justifyContent: "space-between",
      }}>
        <span>IDEAL vs NOISY — side-by-side comparison</span>
        <span style={{
          fontSize: 9, color: "var(--accent-amber)", padding: "1px 5px",
          background: "rgba(245,158,11,0.1)", borderRadius: 3,
          border: "1px solid rgba(245,158,11,0.2)",
        }}>GAP 2</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <canvas ref={canvasRef} width={380} height={200}
          style={{ borderRadius: "var(--radius-md)", maxWidth: "100%" }} />
      </div>
      {!isNoisy && (
        <div style={{
          marginTop: 8, fontSize: 10, color: "var(--text-muted)", textAlign: "center",
        }}>
          Select a noise model to see the comparison
        </div>
      )}
    </div>
  )
}
