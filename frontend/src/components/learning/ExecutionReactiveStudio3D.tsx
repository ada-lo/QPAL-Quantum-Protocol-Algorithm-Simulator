import { Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { Line, OrbitControls, RoundedBox, Sphere, Text, Torus } from "@react-three/drei"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import * as THREE from "three"

import type { WorkspaceExecutionStep, WorkspaceSimulationResponse } from "@/lib/workspace/types"

type Vec3 = [number, number, number]

interface ExecutionReactiveStudioPanelProps {
  simulation: WorkspaceSimulationResponse
  activeStep: number
  onStepChange?: (step: number) => void
  compact?: boolean
  onExpand?: () => void
  onClose?: () => void
}

interface CometTrack {
  label: string
  color: string
  weight: number
  positions: Vec3[]
}

interface ProtocolActorLabels {
  sender: string
  receiver: string
  interceptor: string
}

const X_AXIS = new THREE.Vector3(1, 0, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)
const PROTOCOL_CABLE_PATH: Vec3[] = [
  [-2.35, 0.2, 0.46],
  [0, 0.34, -0.16],
  [2.35, 0.2, 0.46],
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function statevectorMagnitudeAndPhase(flat: number[], index: number) {
  const re = flat[2 * index] ?? 0
  const im = flat[2 * index + 1] ?? 0
  const probability = re * re + im * im
  const phase = Math.atan2(im, re)
  return { probability, phase }
}

function basisLabel(index: number, nQubits: number) {
  const width = Math.max(2, Math.min(nQubits, 12))
  return `|${index.toString(2).padStart(width, "0")}>`
}

function pointOnPolyline(points: Vec3[], t: number): Vec3 {
  if (points.length === 0) return [0, 0, 0]
  if (points.length === 1) return points[0]
  const clamped = clamp(t, 0, 0.9999)
  const scaled = clamped * (points.length - 1)
  const idx = Math.floor(scaled)
  const local = scaled - idx
  return lerpVec3(points[idx], points[idx + 1], local)
}

function trailPointsForDisplay(path: Vec3[], displayStep: number) {
  if (path.length === 0) return []
  const clamped = clamp(displayStep, 0, path.length - 1)
  const low = Math.floor(clamped)
  const high = Math.min(path.length - 1, low + 1)
  const blend = clamped - low
  const points = path.slice(0, low + 1)
  if (high !== low) points.push(lerpVec3(path[low], path[high], blend))
  return points
}

function fibonacciDirection(index: number, total: number) {
  if (total <= 1) return new THREE.Vector3(0, 1, 0)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (index / (total - 1)) * 2
  const radial = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = goldenAngle * index
  return new THREE.Vector3(Math.cos(theta) * radial, y, Math.sin(theta) * radial)
}

function deriveProtocolActors(steps: WorkspaceExecutionStep[]): ProtocolActorLabels {
  let sender = "Alice"
  let receiver = "Bob"
  let interceptor = "Eve"

  for (const step of steps) {
    if (step.instruction.opcode.toUpperCase() === "SEND" && step.instruction.actors.length >= 2) {
      sender = step.instruction.actors[0]
      receiver = step.instruction.actors[1]
      break
    }
  }
  for (const step of steps) {
    if (step.instruction.opcode.toUpperCase() === "INTERCEPT" && step.instruction.actors.length >= 1) {
      interceptor = step.instruction.actors[0]
      break
    }
  }

  return { sender, receiver, interceptor }
}

function buildCometTracks(simulation: WorkspaceSimulationResponse): CometTrack[] {
  const steps = simulation.steps
  const nQubits = Math.max(1, simulation.summary.qubits.length)
  const fallback = simulation.statevector

  const resolvedStatevectors: number[][] = []
  let latest = fallback
  for (const step of steps) {
    const flat = step.state?.statevector
    if (flat && flat.length > 0) latest = flat
    resolvedStatevectors.push(latest)
  }

  const finalFlat = resolvedStatevectors[resolvedStatevectors.length - 1] ?? fallback
  const dimension = Math.max(1, Math.min(Math.floor(finalFlat.length / 2), 4096))
  const probs = new Array<number>(dimension).fill(0)
  for (let i = 0; i < dimension; i += 1) {
    const re = finalFlat[2 * i] ?? 0
    const im = finalFlat[2 * i + 1] ?? 0
    probs[i] = re * re + im * im
  }

  const maxNodes = dimension <= 16 ? dimension : dimension <= 64 ? 20 : 28
  const selected = [...Array(dimension).keys()].sort((a, b) => probs[b] - probs[a]).slice(0, maxNodes)

  return selected.map((amplitudeIndex, nodeIndex) => {
    const baseDirection = fibonacciDirection(nodeIndex, selected.length)
    const color = new THREE.Color().setHSL((0.52 + nodeIndex * 0.07) % 1, 0.9, 0.66).getStyle()
    const positions: Vec3[] = resolvedStatevectors.map((flat, stepIndex) => {
      const { probability, phase } = statevectorMagnitudeAndPhase(flat, amplitudeIndex)
      const amplitude = Math.sqrt(probability)
      const swirl = phase * 0.56 + stepIndex * 0.08
      const nodalTilt = (amplitude - 0.5) * 1.05
      const radialBoost = 2.08 + amplitude * 0.36

      const v = baseDirection.clone()
      v.applyAxisAngle(Y_AXIS, swirl)
      v.applyAxisAngle(X_AXIS, nodalTilt)
      v.applyAxisAngle(Z_AXIS, Math.sin(phase) * 0.16)
      v.normalize().multiplyScalar(radialBoost)
      return [v.x, v.y, v.z]
    })

    return {
      label: basisLabel(amplitudeIndex, nQubits),
      color,
      weight: probs[amplitudeIndex] ?? 0,
      positions,
    }
  })
}

function RelayStation({
  position,
  label,
  accent,
  active,
  sublabel,
}: {
  position: Vec3
  label: string
  accent: string
  active: boolean
  sublabel?: string
}) {
  return (
    <group position={position}>
      <RoundedBox args={[1.24, 0.2, 0.86]} radius={0.06} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#122238" metalness={0.42} roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.66, 0.09]} radius={0.05} position={[0, 0.34, -0.16]}>
        <meshStandardMaterial color="#0f1d2f" emissive={accent} emissiveIntensity={active ? 0.34 : 0.1} />
      </RoundedBox>
      <RoundedBox args={[0.84, 0.06, 0.64]} radius={0.03} position={[0, 0.02, 0]}>
        <meshStandardMaterial color={active ? accent : "#4e607b"} emissive={accent} emissiveIntensity={active ? 0.5 : 0.12} />
      </RoundedBox>
      <Text position={[0, 0.86, 0.1]} fontSize={0.13} color={active ? accent : "#9eb6d8"} anchorX="center" anchorY="middle">
        {label}
      </Text>
      {sublabel && (
        <Text position={[0, 0.68, 0.1]} fontSize={0.075} color="#7f95b4" anchorX="center" anchorY="middle">
          {sublabel}
        </Text>
      )}
    </group>
  )
}

function CometTrailsScene({ simulation, displayStep }: { simulation: WorkspaceSimulationResponse; displayStep: number }) {
  const tracks = useMemo(() => buildCometTracks(simulation), [simulation])

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.14, 0]}>
        <circleGeometry args={[3.5, 80]} />
        <meshStandardMaterial color="#081321" emissive="#0d2238" emissiveIntensity={0.45} />
      </mesh>
      <Torus args={[2.64, 0.02, 16, 120]} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <meshStandardMaterial color="#3ec9ff" emissive="#3ec9ff" emissiveIntensity={0.34} transparent opacity={0.5} />
      </Torus>

      <Sphere args={[2.2, 64, 64]}>
        <meshStandardMaterial color="#08162a" emissive="#1ca8ff" emissiveIntensity={0.25} transparent opacity={0.4} />
      </Sphere>
      <Sphere args={[2.24, 42, 42]}>
        <meshStandardMaterial color="#6de2ff" wireframe transparent opacity={0.1} />
      </Sphere>
      <Sphere args={[0.16, 22, 22]}>
        <meshStandardMaterial color="#83e9ff" emissive="#83e9ff" emissiveIntensity={1} />
      </Sphere>

      {tracks.map((track) => {
        const trail = trailPointsForDisplay(track.positions, displayStep)
        const head = trail[trail.length - 1] ?? track.positions[0]
        const markerRadius = 0.05 + Math.min(0.15, Math.sqrt(track.weight) * 0.18)
        return (
          <group key={track.label}>
            {trail.length > 1 && <Line points={trail} color={track.color} lineWidth={2.2} transparent opacity={0.74} />}
            <Sphere args={[markerRadius, 18, 18]} position={head}>
              <meshStandardMaterial color={track.color} emissive={track.color} emissiveIntensity={0.92} />
            </Sphere>
          </group>
        )
      })}
    </>
  )
}

function FiberRelayScene({ simulation, displayStep }: { simulation: WorkspaceSimulationResponse; displayStep: number }) {
  const actors = useMemo(() => deriveProtocolActors(simulation.steps), [simulation.steps])
  const maxStep = Math.max(0, simulation.steps.length - 1)
  const stepIndex = clamp(Math.floor(displayStep), 0, maxStep)

  let transportIndex = -1
  for (let idx = stepIndex; idx >= 0; idx -= 1) {
    const op = simulation.steps[idx].instruction.opcode.toUpperCase()
    if (op === "SEND" || op === "INTERCEPT") {
      transportIndex = idx
      break
    }
  }

  const transportOp = transportIndex >= 0 ? simulation.steps[transportIndex].instruction.opcode.toUpperCase() : null
  const transportAge = transportIndex >= 0 ? displayStep - transportIndex : Number.POSITIVE_INFINITY
  const pulseT = clamp(transportAge, 0, 1)
  const pulseVisible = transportIndex >= 0 && transportAge <= 1.12
  const interceptMode = transportOp === "INTERCEPT"
  const corruptedPulse = interceptMode && pulseT > 0.48
  const pulseColor = corruptedPulse ? "#ff6677" : "#74efff"
  const pulsePoint = pointOnPolyline(PROTOCOL_CABLE_PATH, pulseT)

  const currentStep = simulation.steps[stepIndex]
  const highlightedOp = currentStep.instruction.opcode.toUpperCase()
  const eveDrop = interceptMode ? clamp(pulseT * 1.75, 0, 1) : 0

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.14, 0]}>
        <circleGeometry args={[3.5, 80]} />
        <meshStandardMaterial color="#070f1d" emissive="#0c1a31" emissiveIntensity={0.55} />
      </mesh>
      <Torus args={[2.66, 0.016, 14, 120]} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <meshStandardMaterial color="#4edbff" emissive="#4edbff" emissiveIntensity={0.28} transparent opacity={0.48} />
      </Torus>

      <RelayStation position={[-2.36, -0.04, 0.62]} label={actors.sender} accent="#6be8ff" active={highlightedOp === "SEND"} sublabel="quantum source" />
      <RelayStation position={[2.36, -0.04, 0.62]} label={actors.receiver} accent="#8cffd3" active={highlightedOp === "SEND" || highlightedOp === "MEASURE"} sublabel="quantum sink" />

      <Line points={PROTOCOL_CABLE_PATH} color="#65ddff" lineWidth={2.8} transparent opacity={0.86} />
      <Line points={PROTOCOL_CABLE_PATH} color="#65ddff" lineWidth={8} transparent opacity={0.14} />

      {pulseVisible && (
        <group>
          <Sphere args={[0.11, 20, 20]} position={pulsePoint}>
            <meshStandardMaterial color={pulseColor} emissive={pulseColor} emissiveIntensity={1.15} />
          </Sphere>
          <Sphere args={[0.19, 18, 18]} position={pulsePoint}>
            <meshStandardMaterial color={pulseColor} emissive={pulseColor} emissiveIntensity={0.45} transparent opacity={0.25} />
          </Sphere>
        </group>
      )}

      {interceptMode && (
        <RelayStation
          position={[0, 1.42 - eveDrop * 1.18, 0.1]}
          label={actors.interceptor}
          accent="#ff6277"
          active
          sublabel="interceptor"
        />
      )}
    </>
  )
}

function ExecutionScene({ simulation, displayStep }: { simulation: WorkspaceSimulationResponse; displayStep: number }) {
  if (simulation.kind === "protocol") return <FiberRelayScene simulation={simulation} displayStep={displayStep} />
  return <CometTrailsScene simulation={simulation} displayStep={displayStep} />
}

function titleForMode(kind: WorkspaceSimulationResponse["kind"]) {
  return kind === "protocol" ? "Fiber-Optic Relay" : "Comet Trails Global Sphere"
}

function subtitleForMode(kind: WorkspaceSimulationResponse["kind"]) {
  return kind === "protocol"
    ? "SEND pulses flow through the cable, and INTERCEPT drops in a hostile relay that corrupts transit."
    : "Global basis states move across one Q-sphere and leave trails as execution steps evolve."
}

export function ExecutionReactiveStudioPanel({
  simulation,
  activeStep,
  onStepChange,
  compact = false,
  onExpand,
  onClose,
}: ExecutionReactiveStudioPanelProps) {
  const maxStep = Math.max(0, simulation.steps.length - 1)
  const clampedStep = clamp(activeStep, 0, maxStep)
  const [playing, setPlaying] = useState(false)
  const [displayStep, setDisplayStep] = useState(clampedStep)
  const displayStepRef = useRef(clampedStep)

  useEffect(() => {
    displayStepRef.current = displayStep
  }, [displayStep])

  useEffect(() => {
    let frame = 0
    const from = displayStepRef.current
    const to = clampedStep
    if (Math.abs(to - from) < 0.0001) {
      setDisplayStep(to)
      return
    }

    const duration = 380 + Math.min(220, Math.abs(to - from) * 45)
    const started = performance.now()
    const animate = (now: number) => {
      const progress = clamp((now - started) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayStep(from + (to - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [clampedStep])

  useEffect(() => {
    if (!playing || !onStepChange || maxStep === 0) return
    const timer = window.setInterval(() => {
      onStepChange(clampedStep >= maxStep ? 0 : clampedStep + 1)
    }, 860)
    return () => window.clearInterval(timer)
  }, [playing, onStepChange, clampedStep, maxStep])

  useEffect(() => {
    if (maxStep === 0) setPlaying(false)
  }, [maxStep])

  const step = simulation.steps[clampedStep]
  const title = titleForMode(simulation.kind)
  const subtitle = subtitleForMode(simulation.kind)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))" }}>
      <div style={{ ...panelHeaderStyle, padding: compact ? "12px 14px 10px" : "16px 18px 12px" }}>
        <div>
          <div style={eyebrowStyle}>STUDIO 3D</div>
          <div style={{ fontSize: compact ? 16 : 20, fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 6 }}>
            {title}
          </div>
          <div style={{ fontSize: compact ? 11 : 13, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 840 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {onExpand && (
            <button type="button" onClick={onExpand} style={chromeButtonStyle}>
              Expand
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} style={chromeButtonStyle}>
              Close
            </button>
          )}
        </div>
      </div>

      <div style={{ ...controlRailStyle, padding: compact ? "10px 12px 8px" : "12px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={iconButtonStyle}
              onClick={() => onStepChange?.(Math.max(0, clampedStep - 1))}
              disabled={!onStepChange || clampedStep <= 0}
              aria-label="Previous step"
            >
              <SkipBack size={14} />
            </button>
            <button
              type="button"
              style={iconButtonStyle}
              onClick={() => setPlaying((current) => !current)}
              disabled={!onStepChange || maxStep === 0}
              aria-label={playing ? "Pause playback" : "Play execution"}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              style={iconButtonStyle}
              onClick={() => onStepChange?.(Math.min(maxStep, clampedStep + 1))}
              disabled={!onStepChange || clampedStep >= maxStep}
              aria-label="Next step"
            >
              <SkipForward size={14} />
            </button>
            <div style={stepPillStyle}>
              step {clampedStep + 1} / {maxStep + 1}
            </div>
          </div>
          <div style={opcodePillStyle}>
            {step?.instruction.opcode ?? "N/A"}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={maxStep}
          step={1}
          value={clampedStep}
          onChange={(event) => onStepChange?.(Number(event.currentTarget.value))}
          disabled={!onStepChange || maxStep === 0}
          style={sliderStyle}
          aria-label="Execution timeline"
        />
      </div>

      <div style={{ height: compact ? 340 : 520, borderBottom: "1px solid var(--border)", background: "var(--studio-canvas)" }}>
        <Canvas camera={{ position: simulation.kind === "protocol" ? [0, 1.6, 6.2] : [0, 1.65, 6.1], fov: compact ? 40 : 35 }}>
          <color attach="background" args={["#040b16"]} />
          <fog attach="fog" args={["#040b16", 4.6, 9.6]} />
          <ambientLight intensity={0.76} />
          <directionalLight position={[3, 4.2, 3]} intensity={1.2} color="#a8d8ff" />
          <pointLight position={[-2.3, 1.4, 2.6]} intensity={1.05} color="#48d6ff" />
          <pointLight position={[2.6, 1.4, 2.2]} intensity={0.75} color="#94ffd6" />
          <ExecutionScene simulation={simulation} displayStep={displayStep} />
          <OrbitControls
            enablePan={!compact}
            minDistance={4.2}
            maxDistance={8}
            autoRotate={!compact}
            autoRotateSpeed={0.2}
            minPolarAngle={0.62}
            maxPolarAngle={1.44}
          />
        </Canvas>
      </div>

      <div style={{ padding: compact ? "12px 14px" : "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={noticeCardStyle}>
          <div style={noticeEyebrowStyle}>CURRENT EVENT</div>
          <div style={{ color: "var(--text-secondary)", lineHeight: 1.65, fontSize: compact ? 12 : 13 }}>
            {step?.event ?? "Execution event unavailable."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={legendPillStyle}>Glow nodes: basis states</span>
          {simulation.kind === "algorithm" ? (
            <span style={legendPillStyle}>Trails: motion across execution steps</span>
          ) : (
            <span style={legendPillStyle}>Red node: active interception</span>
          )}
          <span style={legendPillStyle}>Scrub slider to replay and rewind</span>
        </div>
      </div>
    </div>
  )
}

const panelHeaderStyle: CSSProperties = {
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
}

const controlRailStyle: CSSProperties = {
  borderBottom: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  marginBottom: 6,
}

const chromeButtonStyle: CSSProperties = {
  height: 34,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  fontSize: 12,
  fontWeight: 600,
}

const iconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  display: "grid",
  placeItems: "center",
}

const stepPillStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  padding: "8px 12px",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

const opcodePillStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(0, 212, 255, 0.42)",
  background: "rgba(0, 212, 255, 0.1)",
  color: "var(--accent-cyan)",
  padding: "6px 12px",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  fontWeight: 700,
}

const sliderStyle: CSSProperties = {
  width: "100%",
}

const noticeCardStyle: CSSProperties = {
  padding: "11px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
}

const noticeEyebrowStyle: CSSProperties = {
  fontSize: 9,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  marginBottom: 6,
}

const legendPillStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  padding: "5px 10px",
  fontSize: 11,
}

