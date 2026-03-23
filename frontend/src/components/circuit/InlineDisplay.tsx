import { useSimStore } from "@/store/simStore"
import { useCircuitStore } from "@/store/circuitStore"
import type { GateId } from "@/lib/quantum/gates"
import { blochVector, probabilities } from "@/lib/quantum/simulator"
import { formatBasisState } from "@/lib/quantum/stateVector"
import { useMemo } from "react"

interface Props {
  gateId: GateId
  qubit: number
  step: number
}

export function InlineDisplay({ gateId, qubit, step }: Props) {
  const snapshots = useSimStore(s => s.snapshots) as any[]
  const nQubits = useCircuitStore(s => s.nQubits)

  // Find the snapshot for this step (or closest prior step)
  const snap = useMemo(() => {
    if (!snapshots?.length) return null
    // Find the snapshot at or just before this step
    let best = snapshots[0]
    for (const s of snapshots) {
      if (s.step <= step) best = s
    }
    return best
  }, [snapshots, step])

  if (!snap) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
        background: 'rgba(255,255,255,0.03)', borderRadius: 3,
        border: '1px dashed var(--border)',
      }}>
        {gateId === 'CHANCE' ? '%' : gateId === 'AMPS' ? 'Amp' : gateId === 'BLOCH' ? 'B' : 'ρ'}
      </div>
    )
  }

  if (gateId === 'CHANCE') return <ChanceDisplay sv={snap.sv} n={nQubits} qubit={qubit} />
  if (gateId === 'BLOCH') return <BlochMiniDisplay sv={snap.sv} n={nQubits} qubit={qubit} />
  if (gateId === 'AMPS') return <AmplitudeDisplay sv={snap.sv} n={nQubits} qubit={qubit} />
  if (gateId === 'DENSITY') return <DensityDisplay sv={snap.sv} n={nQubits} qubit={qubit} />

  return null
}

function ChanceDisplay({ sv, n, qubit }: { sv: Float64Array; n: number; qubit: number }) {
  // Show P(|0⟩) and P(|1⟩) for this qubit
  const dim = 1 << n
  let p0 = 0, p1 = 0
  for (let i = 0; i < dim; i++) {
    const prob = sv[2 * i] ** 2 + sv[2 * i + 1] ** 2
    if (((i >> qubit) & 1) === 0) p0 += prob
    else p1 += prob
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', gap: 1,
      background: 'rgba(46,125,50,0.08)', borderRadius: 3,
      border: '1px solid rgba(46,125,50,0.3)',
      padding: '2px 1px',
    }}>
      <div style={{ display: 'flex', width: '100%', gap: 1, height: 12, padding: '0 2px' }}>
        <div style={{
          flex: p0, background: '#2E7D32', borderRadius: 1,
          minWidth: p0 > 0.01 ? 2 : 0,
          transition: 'flex 0.3s ease',
        }} />
        <div style={{
          flex: p1, background: '#1B5E20', borderRadius: 1,
          minWidth: p1 > 0.01 ? 2 : 0,
          transition: 'flex 0.3s ease',
        }} />
      </div>
      <div style={{
        fontSize: 6, fontFamily: 'var(--font-mono)', color: '#66BB6A',
        display: 'flex', gap: 4,
      }}>
        <span>{(p0 * 100).toFixed(0)}%</span>
        <span>{(p1 * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

function BlochMiniDisplay({ sv, n, qubit }: { sv: Float64Array; n: number; qubit: number }) {
  const bv = blochVector(sv, n, qubit)
  const r = 12
  const cx = 16, cy = 14

  // Project Bloch sphere to 2D
  const px = bv.x * r * 0.8
  const py = -bv.z * r * 0.8 // Z is up on Bloch sphere

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(106,27,154,0.08)', borderRadius: 3,
      border: '1px solid rgba(106,27,154,0.3)',
    }}>
      <svg width={32} height={28} viewBox="0 0 32 28">
        {/* Circle outline */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(106,27,154,0.3)" strokeWidth={0.5} />
        {/* Cross */}
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(106,27,154,0.2)" strokeWidth={0.3} />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(106,27,154,0.2)" strokeWidth={0.3} />
        {/* State vector point */}
        <circle cx={cx + px} cy={cy + py} r={2.5} fill="#AB47BC" />
        <line x1={cx} y1={cy} x2={cx + px} y2={cy + py} stroke="#AB47BC" strokeWidth={0.8} />
      </svg>
    </div>
  )
}

function AmplitudeDisplay({ sv, n, qubit }: { sv: Float64Array; n: number; qubit: number }) {
  const dim = 1 << n
  let a0r = 0, a0i = 0, a1r = 0, a1i = 0

  // Reduced amplitudes for this qubit
  for (let i = 0; i < dim; i++) {
    const ar = sv[2 * i], ai = sv[2 * i + 1]
    if (((i >> qubit) & 1) === 0) { a0r += ar; a0i += ai }
    else { a1r += ar; a1i += ai }
  }

  const mag0 = Math.sqrt(a0r * a0r + a0i * a0i)
  const mag1 = Math.sqrt(a1r * a1r + a1i * a1i)
  const phase0 = Math.atan2(a0i, a0r)
  const phase1 = Math.atan2(a1i, a1r)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
      background: 'rgba(21,101,192,0.08)', borderRadius: 3,
      border: '1px solid rgba(21,101,192,0.3)',
    }}>
      <AmplitudeCircle mag={mag0} phase={phase0} />
      <AmplitudeCircle mag={mag1} phase={phase1} />
    </div>
  )
}

function AmplitudeCircle({ mag, phase }: { mag: number; phase: number }) {
  const r = 8
  const cr = Math.min(r, mag * r)
  return (
    <svg width={18} height={18} viewBox="0 0 18 18">
      <circle cx={9} cy={9} r={r} fill="none" stroke="rgba(21,101,192,0.3)" strokeWidth={0.5} />
      <circle cx={9} cy={9} r={cr} fill="rgba(21,101,192,0.4)" stroke="none" />
      {mag > 0.01 && (
        <line
          x1={9} y1={9}
          x2={9 + r * Math.cos(phase)} y2={9 - r * Math.sin(phase)}
          stroke="#1565C0" strokeWidth={1}
        />
      )}
    </svg>
  )
}

function DensityDisplay({ sv, n, qubit }: { sv: Float64Array; n: number; qubit: number }) {
  // 2x2 density matrix for single qubit
  const dim = 1 << n
  let r00 = 0, r01r = 0, r01i = 0, r11 = 0

  for (let i = 0; i < dim; i++) {
    const qi = (i >> qubit) & 1
    const ar = sv[2 * i], ai = sv[2 * i + 1]
    const prob = ar * ar + ai * ai

    if (qi === 0) {
      r00 += prob
      const j = i | (1 << qubit)
      const br = sv[2 * j], bi = sv[2 * j + 1]
      r01r += ar * br + ai * bi
      r01i += ai * br - ar * bi
    } else {
      r11 += prob
    }
  }

  const entries = [
    { r: r00, i: 0, x: 0, y: 0 },
    { r: r01r, i: r01i, x: 1, y: 0 },
    { r: r01r, i: -r01i, x: 0, y: 1 },
    { r: r11, i: 0, x: 1, y: 1 },
  ]

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 1, padding: 2,
      background: 'rgba(78,52,46,0.08)', borderRadius: 3,
      border: '1px solid rgba(78,52,46,0.3)',
    }}>
      {entries.map((e, idx) => {
        const mag = Math.sqrt(e.r * e.r + e.i * e.i)
        const opacity = Math.max(0.1, mag)
        return (
          <div key={idx} style={{
            width: '100%', aspectRatio: '1',
            background: `rgba(78,52,46,${opacity * 0.5})`,
            borderRadius: 1,
          }} />
        )
      })}
    </div>
  )
}
