
import { useRef, useEffect } from "react"

// Bloch sphere states for BB84 encoding
const BLOCH_STATES: Record<string, { theta: number; phi: number; label: string }> = {
  "+0": { theta: 0,           phi: 0,      label: "|0⟩" },        // north pole
  "+1": { theta: Math.PI,     phi: 0,      label: "|1⟩" },        // south pole
  "x0": { theta: Math.PI / 2, phi: 0,      label: "|+⟩" },        // equator +X
  "x1": { theta: Math.PI / 2, phi: Math.PI, label: "|−⟩" },       // equator −X
}

interface BlochSphereProps {
  state: string    // "+0", "+1", "x0", "x1"
  role: "alice" | "bob" | "eve"
  label?: string
  dimmed?: boolean
}

const ROLE_COLORS: Record<string, string> = {
  alice: "59,130,246",
  bob: "139,92,246",
  eve: "239,68,68",
}

function MiniBlochSphere({ state, role, label, dimmed }: BlochSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bs = BLOCH_STATES[state] ?? BLOCH_STATES["+0"]
  const rgb = ROLE_COLORS[role] ?? "0,212,255"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 12

    ctx.clearRect(0, 0, W, H)
    const alpha = dimmed ? 0.3 : 1.0

    // Sphere outline
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.strokeStyle = "rgba(30,45,69,1)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Equatorial dash
    ctx.save()
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.strokeStyle = "rgba(42,63,96,0.5)"
    ctx.lineWidth = 0.7
    ctx.stroke()
    ctx.restore()

    // Axes
    ctx.strokeStyle = "rgba(42,63,96,0.3)"
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R)
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy)
    ctx.stroke()

    // Axis labels
    ctx.font = "7px JetBrains Mono, monospace"
    ctx.fillStyle = "rgba(74,96,128,0.7)"
    ctx.textAlign = "center"
    ctx.fillText("|0⟩", cx, cy - R - 3)
    ctx.fillText("|1⟩", cx, cy + R + 9)

    // Bloch vector
    const bvX = cx + R * Math.sin(bs.theta) * Math.cos(bs.phi)
    const bvY = cy - R * Math.cos(bs.theta)

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(bvX, bvY)
    ctx.strokeStyle = `rgba(${rgb},0.9)`
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.stroke()

    // Arrowhead
    const angle = Math.atan2(bvY - cy, bvX - cx)
    const aLen = 7
    ctx.beginPath()
    ctx.moveTo(bvX, bvY)
    ctx.lineTo(bvX - aLen * Math.cos(angle - 0.4), bvY - aLen * Math.sin(angle - 0.4))
    ctx.lineTo(bvX - aLen * Math.cos(angle + 0.4), bvY - aLen * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fillStyle = `rgba(${rgb},0.95)`
    ctx.fill()

    // Dot at tip
    ctx.beginPath()
    ctx.arc(bvX, bvY, 3, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(${rgb},1)`
    ctx.fill()

    // Origin
    ctx.beginPath()
    ctx.arc(cx, cy, 2, 0, 2 * Math.PI)
    ctx.fillStyle = "rgba(74,96,128,0.6)"
    ctx.fill()

    // State label
    ctx.font = "9px JetBrains Mono, monospace"
    ctx.fillStyle = `rgba(${rgb},0.9)`
    ctx.textAlign = "center"
    ctx.fillText(bs.label, cx, cy + R + 22)

    ctx.globalAlpha = 1
  }, [state, role, dimmed])

  return (
    <div style={{ textAlign: "center" }}>
      {label && (
        <div style={{
          fontSize: 9, fontFamily: "var(--font-mono)", marginBottom: 4,
          color: dimmed ? "var(--text-muted)" : `rgb(${rgb})`,
          fontWeight: 700,
        }}>
          {label}
        </div>
      )}
      <canvas ref={canvasRef} width={100} height={120}
        style={{ borderRadius: "var(--radius-md)", opacity: dimmed ? 0.4 : 1 }} />
    </div>
  )
}

/* ── Panel showing Alice / Bob / Eve Bloch spheres ── */
interface BB84BlochPanelProps {
  selectedQubit: number | null
  qbits: Array<{
    bit: 0 | 1; aliceBasis: "+" | "x"; bobBasis: "+" | "x"
    eveBasis: "+" | "x"; eveMeasured: 0 | 1; bobResult: 0 | 1
  }>
  evePresent: boolean
}

export function BB84BlochPanel({ selectedQubit, qbits, evePresent }: BB84BlochPanelProps) {
  if (selectedQubit === null || !qbits[selectedQubit]) {
    return (
      <div style={{
        padding: 14, textAlign: "center", color: "var(--text-muted)",
        fontSize: 11, lineHeight: 1.6,
      }}>
        Click a qubit row to see Bloch sphere states for Alice, Bob{evePresent ? ", and Eve" : ""}.
      </div>
    )
  }

  const q = qbits[selectedQubit]
  const aliceState = `${q.aliceBasis}${q.bit}`
  const bobState = `${q.bobBasis}${q.bobResult}`
  const eveState = `${q.eveBasis}${q.eveMeasured}`

  return (
    <div style={{ padding: "10px 8px" }}>
      <div style={{
        fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
        marginBottom: 10, textAlign: "center",
      }}>
        QUBIT #{selectedQubit} — BLOCH STATES
      </div>
      <div style={{
        display: "flex", gap: 8, justifyContent: "center",
        flexWrap: "wrap",
      }}>
        <MiniBlochSphere state={aliceState} role="alice" label="Alice sends" />
        {evePresent && (
          <MiniBlochSphere state={eveState} role="eve" label="Eve reads"
            dimmed={q.eveBasis === q.aliceBasis} />
        )}
        <MiniBlochSphere state={bobState} role="bob" label="Bob gets" />
      </div>
      {/* Match indicator */}
      <div style={{
        marginTop: 10, textAlign: "center", fontSize: 10, fontFamily: "var(--font-mono)",
        color: q.aliceBasis === q.bobBasis ? "var(--accent-green)" : "var(--text-muted)",
      }}>
        {q.aliceBasis === q.bobBasis
          ? `✓ Bases match (${q.aliceBasis}) → key bit`
          : `✗ Bases differ (${q.aliceBasis} vs ${q.bobBasis}) → discarded`}
      </div>
    </div>
  )
}
