import { Canvas } from "@react-three/fiber"
import { Float, Line, OrbitControls, RoundedBox, Sphere, Text, Torus } from "@react-three/drei"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import type { LearningExperience } from "@/lib/quantum/learningCatalog"
import { getLearningSceneProfile } from "@/lib/quantum/learningSceneProfiles"

type Vec3 = [number, number, number]

function supportColor(level: LearningExperience["support"]) {
  return level === "implemented" ? "#4f7b4a" : level === "demo" ? "#9c6b24" : "#b75a45"
}

function curve(points: Vec3[]) {
  return points
}

function tokenPoint(points: Vec3[], t: number): Vec3 {
  if (points.length < 2) return points[0] ?? [0, 0, 0]
  const scaled = Math.min(Math.max(t, 0), 0.999) * (points.length - 1)
  const index = Math.floor(scaled)
  const localT = scaled - index
  const a = points[index]
  const b = points[index + 1]
  return [
    a[0] + (b[0] - a[0]) * localT,
    a[1] + (b[1] - a[1]) * localT,
    a[2] + (b[2] - a[2]) * localT,
  ]
}

function StageFloor({ accent }: { accent: string }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <circleGeometry args={[3.35, 80]} />
        <meshBasicMaterial color="#f7f2e8" />
      </mesh>
      <Torus args={[2.55, 0.012, 14, 120]} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.04, 0]}>
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} transparent opacity={0.38} />
      </Torus>
      <Torus args={[1.7, 0.01, 14, 100]} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.04, 0]}>
        <meshStandardMaterial color="#d9cfbd" transparent opacity={0.5} />
      </Torus>
    </>
  )
}

function Station({
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
      <RoundedBox args={[1.18, 0.18, 0.88]} radius={0.05} position={[0, -0.12, 0]}>
        <meshStandardMaterial color="#efe7d9" metalness={0.08} roughness={0.65} />
      </RoundedBox>
      <RoundedBox args={[0.86, 0.6, 0.07]} radius={0.04} position={[0, 0.32, -0.18]}>
        <meshStandardMaterial color="#f8f4ec" emissive={accent} emissiveIntensity={active ? 0.18 : 0.04} />
      </RoundedBox>
      <RoundedBox args={[0.92, 0.05, 0.72]} radius={0.03} position={[0, 0.02, 0]}>
        <meshStandardMaterial color={active ? accent : "#d9cfbd"} emissive={active ? accent : "#d9cfbd"} emissiveIntensity={active ? 0.12 : 0.01} />
      </RoundedBox>
      <Text position={[0, 0.78, 0.08]} fontSize={0.14} color={active ? accent : "#3f4b45"} anchorX="center" anchorY="middle">
        {label}
      </Text>
      {sublabel && (
        <Text position={[0, 0.62, 0.08]} fontSize={0.08} color="#7e837b" anchorX="center" anchorY="middle">
          {sublabel}
        </Text>
      )}
    </group>
  )
}

function RegisterDots({ position, accent, count }: { position: Vec3; accent: string; count: number }) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, index) => (
        <Float key={index} speed={1 + index * 0.1} rotationIntensity={0.2} floatIntensity={0.25}>
          <group position={[0, 0.12 + index * 0.18, (index - (count - 1) / 2) * 0.12]}>
            <Sphere args={[0.09, 20, 20]}>
              <meshStandardMaterial color="#ffffff" roughness={0.12} metalness={0.1} />
            </Sphere>
            <Sphere args={[0.03, 12, 12]} position={[0.04, 0.03, 0]}>
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
            </Sphere>
          </group>
        </Float>
      ))}
    </group>
  )
}

function MovingToken({ path, accent, t }: { path: Vec3[]; accent: string; t: number }) {
  const [x, y, z] = tokenPoint(path, t)
  return (
    <>
      <Line points={curve(path)} color={accent} lineWidth={1.8} transparent opacity={0.65} />
      <Sphere args={[0.08, 16, 16]} position={[x, y, z]}>
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
      </Sphere>
    </>
  )
}

function ProbabilityBarGrid({
  origin,
  accent,
  dominant,
  stageIndex,
}: {
  origin: Vec3
  accent: string
  dominant: [number, number]
  stageIndex: number
}) {
  const bars = useMemo(() => {
    return Array.from({ length: 4 }, (_, x) =>
      Array.from({ length: 4 }, (_, y) => {
        const distance = Math.abs(x - dominant[0]) + Math.abs(y - dominant[1])
        const base = stageIndex === 0 ? 0.16 + (x + y) * 0.03 : stageIndex === 1 ? 0.18 + Math.max(0, 0.22 - distance * 0.05) : 0.1 + Math.max(0, 0.62 - distance * 0.14)
        return { x, y, height: base }
      }),
    ).flat()
  }, [dominant, stageIndex])

  return (
    <group position={origin}>
      {bars.map((bar) => {
        const active = bar.x === dominant[0] && bar.y === dominant[1]
        return (
          <RoundedBox
            key={`${bar.x}-${bar.y}`}
            args={[0.14, bar.height, 0.14]}
            radius={0.025}
            position={[(bar.x - 1.5) * 0.22, bar.height / 2 - 0.25, (bar.y - 1.5) * 0.22]}
          >
            <meshStandardMaterial
              color={active ? accent : "#b6d1c6"}
              emissive={active ? accent : "#b6d1c6"}
              emissiveIntensity={active ? 0.3 : 0.04}
            />
          </RoundedBox>
        )
      })}
    </group>
  )
}

function QuantumWalkGrid({ stageIndex }: { stageIndex: number }) {
  const bars = useMemo(() => {
    return Array.from({ length: 8 }, (_, x) =>
      Array.from({ length: 8 }, (_, y) => {
        const dx = x - 3.5
        const dy = y - 3.5
        const radius = Math.sqrt(dx * dx + dy * dy)
        const angular = Math.sin((x + 1) * 0.65) * Math.cos((y + 1) * 0.55)
        const height =
          stageIndex === 0
            ? Math.max(0.03, 0.2 - radius * 0.03)
            : stageIndex === 1
              ? Math.max(0.04, 0.16 + angular * 0.08 - radius * 0.018)
              : Math.max(0.05, 0.12 + Math.abs(angular) * 0.18 + (radius > 2.2 ? 0.1 : 0))
        const hue = 220 - x * 12 + y * 4
        return { x, y, height, color: `hsl(${hue} 72% 60%)` }
      }),
    ).flat()
  }, [stageIndex])

  return (
    <group position={[0.4, -0.2, 0.1]} rotation={[0, Math.PI / 4.6, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial color="#f6f0e3" />
      </mesh>
      {bars.map((bar) => (
        <RoundedBox
          key={`${bar.x}-${bar.y}`}
          args={[0.18, bar.height, 0.18]}
          radius={0.03}
          position={[(bar.x - 3.5) * 0.28, bar.height / 2 - 0.24, (bar.y - 3.5) * 0.28]}
        >
          <meshStandardMaterial color={bar.color} emissive={bar.color} emissiveIntensity={0.18} />
        </RoundedBox>
      ))}
      <Text position={[1.75, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.11} color="#5f6b64">
        X positions
      </Text>
      <Text position={[0, 0.1, 1.75]} fontSize={0.11} color="#5f6b64">
        Y positions
      </Text>
      <Text position={[-1.85, 1.1, -1.45]} rotation={[0, Math.PI / 2, 0]} fontSize={0.11} color="#5f6b64">
        Probabilities
      </Text>
    </group>
  )
}

function EnergyCurve({ accent, stageIndex }: { accent: string; stageIndex: number }) {
  const points: Vec3[] = [
    [-0.7, 0.32, 0],
    [-0.35, 0.1, 0],
    [0, -0.24, 0],
    [0.35, -0.08, 0],
    [0.75, 0.24, 0],
  ]
  const marker = stageIndex === 0 ? points[0] : stageIndex === 1 ? points[2] : points[3]
  return (
    <group position={[1.8, 0.8, 0.3]}>
      <Line points={points} color={accent} lineWidth={2.2} />
      <Sphere args={[0.07, 16, 16]} position={marker}>
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.55} />
      </Sphere>
    </group>
  )
}

function ProtocolScene({ experience, stageIndex }: { experience: LearningExperience; stageIndex: number }) {
  const profile = getLearningSceneProfile(experience.id)
  const accent = experience.accent
  const safe = supportColor(experience.support)
  const qkd = ["bb84", "e91", "b92"].includes(experience.id)
  const entangled = ["teleport", "superdense", "e91"].includes(experience.id)
  const left: Vec3 = [-2.05, -0.05, 0.6]
  const center: Vec3 = [0, 0.02, -0.1]
  const right: Vec3 = [2.05, -0.05, 0.6]
  const extra: Vec3 = [0, 0.28, 1.45]

  return (
    <>
      <StageFloor accent={accent} />
      <Station position={left} label={profile.labels.left} accent={accent} active={stageIndex === 0} />
      <Station position={center} label={profile.labels.center} accent={accent} active={stageIndex === 1} />
      <Station position={right} label={profile.labels.right} accent={accent} active={stageIndex === 2} />
      {profile.labels.extra && (
        <Station position={extra} label={profile.labels.extra} accent={safe} active={stageIndex === (qkd ? 2 : 1)} sublabel={qkd ? "classical check" : "control data"} />
      )}

      <RegisterDots position={[-2.02, 0.14, 0.9]} accent={accent} count={Math.min(3, Math.max(2, experience.nQubits))} />
      <RegisterDots position={[2.02, 0.14, 0.9]} accent={accent} count={Math.min(3, Math.max(2, experience.nQubits))} />

      <MovingToken path={[[-1.65, 0.45, 0.18], [0, 0.7, -0.3], [1.65, 0.45, 0.18]]} accent={accent} t={stageIndex / 2} />

      {entangled && (
        <Line points={[[-1.8, 0.78, 0.08], [0, 1.12, -0.58], [1.8, 0.78, 0.08]]} color={accent} lineWidth={2.1} transparent opacity={0.75} />
      )}
      {qkd && (
        <>
          <Torus args={[0.2, 0.015, 12, 64]} rotation={[Math.PI / 2, 0, 0]} position={[-2.1, 0.72, 1.1]}>
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
          </Torus>
          <Torus args={[0.2, 0.015, 12, 64]} rotation={[Math.PI / 2, 0, 0]} position={[2.1, 0.72, 1.1]}>
            <meshStandardMaterial color={safe} emissive={safe} emissiveIntensity={0.16} />
          </Torus>
        </>
      )}
      {["teleport", "superdense"].includes(experience.id) && (
        <>
          <RoundedBox args={[0.16, 0.16, 0.16]} radius={0.03} position={[0.88, 0.95, 0.18]}>
            <meshStandardMaterial color={safe} emissive={safe} emissiveIntensity={stageIndex === 2 ? 0.35 : 0.08} />
          </RoundedBox>
          <RoundedBox args={[0.16, 0.16, 0.16]} radius={0.03} position={[1.15, 0.95, 0.18]}>
            <meshStandardMaterial color={safe} emissive={safe} emissiveIntensity={stageIndex === 2 ? 0.35 : 0.08} />
          </RoundedBox>
        </>
      )}
    </>
  )
}

function GroverScene({ experience, stageIndex }: { experience: LearningExperience; stageIndex: number }) {
  const accent = experience.accent
  const safe = supportColor(experience.support)
  return (
    <>
      <StageFloor accent={accent} />
      <Station position={[-2.05, -0.05, 0.6]} label="Search register" accent={accent} active={stageIndex === 0} />
      <Station position={[0, 0.02, -0.1]} label="Oracle + diffusion" accent={accent} active={stageIndex === 1} />
      <Station position={[2.05, -0.05, 0.6]} label="Measured outcome" accent={safe} active={stageIndex === 2} />
      <RegisterDots position={[-2.02, 0.14, 0.9]} accent={accent} count={3} />
      <Torus args={[0.58, 0.026, 14, 96]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.78, -0.4]}>
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
      </Torus>
      <MovingToken path={[[-1.6, 0.42, 0.12], [-0.2, 0.78, -0.38], [1.45, 0.42, 0.12]]} accent={accent} t={stageIndex / 2} />
      <ProbabilityBarGrid origin={[2.06, 0.22, 0.82]} accent={safe} dominant={[2, 1]} stageIndex={stageIndex} />
    </>
  )
}

function OracleScene({ experience, stageIndex }: { experience: LearningExperience; stageIndex: number }) {
  const accent = experience.accent
  return (
    <>
      <StageFloor accent={accent} />
      <Station position={[-2.05, -0.05, 0.6]} label="Query register" accent={accent} active={stageIndex === 0} />
      <Station position={[0, 0.02, -0.1]} label="Oracle" accent={accent} active={stageIndex === 1} />
      <Station position={[2.05, -0.05, 0.6]} label="Decision" accent={accent} active={stageIndex === 2} />
      <RegisterDots position={[-2.02, 0.14, 0.9]} accent={accent} count={3} />
      <RoundedBox args={[0.9, 0.9, 0.28]} radius={0.06} position={[0, 0.7, -0.34]}>
        <meshStandardMaterial color="#f8f4ec" emissive={accent} emissiveIntensity={stageIndex === 1 ? 0.15 : 0.03} />
      </RoundedBox>
      <Text position={[0, 0.7, -0.16]} fontSize={0.16} color={accent}>
        U_f
      </Text>
      <MovingToken path={[[-1.55, 0.4, 0.16], [-0.1, 0.78, -0.36], [1.55, 0.4, 0.16]]} accent={accent} t={stageIndex / 2} />
      <ProbabilityBarGrid origin={[2.1, 0.18, 0.86]} accent={accent} dominant={[1, 2]} stageIndex={stageIndex} />
    </>
  )
}

function PhaseScene({ experience, stageIndex }: { experience: LearningExperience; stageIndex: number }) {
  const accent = experience.accent
  const safe = supportColor(experience.support)
  return (
    <>
      <StageFloor accent={accent} />
      <Station position={[-2.05, -0.05, 0.6]} label="Control register" accent={accent} active={stageIndex === 0} />
      <Station position={[0, 0.02, -0.1]} label="Phase structure" accent={accent} active={stageIndex === 1} />
      <Station position={[2.05, -0.05, 0.6]} label="Frequency readout" accent={safe} active={stageIndex === 2} />
      <RegisterDots position={[-2.02, 0.14, 0.9]} accent={accent} count={3} />
      <Torus args={[0.65, 0.018, 14, 84]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.84, -0.42]}>
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} />
      </Torus>
      <Torus args={[0.42, 0.014, 14, 84]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.84, -0.42]}>
        <meshStandardMaterial color="#d8cdb9" />
      </Torus>
      <MovingToken path={[[-1.55, 0.42, 0.14], [0, 0.92, -0.46], [1.55, 0.42, 0.14]]} accent={accent} t={stageIndex / 2} />
      <group position={[2.05, 0.28, 0.78]}>
        {Array.from({ length: 6 }, (_, index) => {
          const height = stageIndex === 0 ? 0.14 : stageIndex === 1 ? 0.2 + index * 0.05 : 0.22 + Math.abs(3 - index) * 0.08
          return (
            <RoundedBox key={index} args={[0.14, height, 0.14]} radius={0.025} position={[(index - 2.5) * 0.18, height / 2 - 0.22, 0]}>
              <meshStandardMaterial color={index === 3 ? safe : accent} emissive={index === 3 ? safe : accent} emissiveIntensity={0.18} />
            </RoundedBox>
          )
        })}
      </group>
    </>
  )
}

function VariationalScene({ experience, stageIndex }: { experience: LearningExperience; stageIndex: number }) {
  const accent = experience.accent
  const safe = supportColor(experience.support)
  const graphNodes: Vec3[] = [
    [-0.3, 0.44, 0.18],
    [0.05, 0.78, -0.06],
    [0.32, 0.4, 0.12],
    [0.18, 0.18, -0.22],
  ]
  return (
    <>
      <StageFloor accent={accent} />
      <Station position={[-2.05, -0.05, 0.6]} label="Ansatz" accent={accent} active={stageIndex === 0} />
      <Station position={[0, 0.02, -0.1]} label="Cost landscape" accent={accent} active={stageIndex === 1} />
      <Station position={[2.05, -0.05, 0.6]} label="Best setting" accent={safe} active={stageIndex === 2} />
      <RegisterDots position={[-2.02, 0.14, 0.9]} accent={accent} count={2} />
      {[
        [graphNodes[0], graphNodes[1]],
        [graphNodes[1], graphNodes[2]],
        [graphNodes[1], graphNodes[3]],
        [graphNodes[2], graphNodes[3]],
      ].map((edge, index) => (
        <Line key={index} points={edge as Vec3[]} color={accent} lineWidth={1.8} transparent opacity={0.7} />
      ))}
      {graphNodes.map((point, index) => (
        <Sphere key={index} args={[0.09, 18, 18]} position={point}>
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
        </Sphere>
      ))}
      <EnergyCurve accent={safe} stageIndex={stageIndex} />
      <MovingToken path={[[-1.5, 0.45, 0.12], [-0.15, 0.9, -0.25], [1.35, 0.55, 0.22]]} accent={accent} t={stageIndex / 2} />
    </>
  )
}

function WalkScene({ experience, stageIndex }: { experience: LearningExperience; stageIndex: number }) {
  return (
    <>
      <StageFloor accent={experience.accent} />
      <QuantumWalkGrid stageIndex={stageIndex} />
      <Text position={[0.1, 1.72, 0]} fontSize={0.18} color={experience.accent} anchorX="center" anchorY="middle">
        Controlled alternating quantum walk
      </Text>
      <Text position={[0.1, 1.48, 0]} fontSize={0.1} color="#5f6b64" anchorX="center" anchorY="middle">
        Structured probability landscape across positions
      </Text>
    </>
  )
}

function SceneContent({ experience, stageIndex }: { experience: LearningExperience; stageIndex: number }) {
  const family = getLearningSceneProfile(experience.id).family
  if (experience.id === "grover") return <GroverScene experience={experience} stageIndex={stageIndex} />
  if (family === "protocol") return <ProtocolScene experience={experience} stageIndex={stageIndex} />
  if (family === "phase") return <PhaseScene experience={experience} stageIndex={stageIndex} />
  if (family === "variational") return <VariationalScene experience={experience} stageIndex={stageIndex} />
  if (family === "walk") return <WalkScene experience={experience} stageIndex={stageIndex} />
  return <OracleScene experience={experience} stageIndex={stageIndex} />
}

export function QuantumShowcase3D({
  experience,
  stageIndex,
  expanded = false,
}: {
  experience: LearningExperience
  stageIndex: number
  expanded?: boolean
}) {
  const camera = experience.id === "qwalk"
    ? { position: [4.4, 3.8, 5.8] as Vec3, fov: expanded ? 36 : 42 }
    : { position: [0, 1.5, 5.6] as Vec3, fov: expanded ? 32 : 38 }

  return (
    <Canvas camera={camera}>
      <color attach="background" args={["#fbf8f1"]} />
      <fog attach="fog" args={["#fbf8f1", 4.2, 9]} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[4, 5, 3]} intensity={1.15} color="#ffffff" />
      <pointLight position={[-2, 2, 4]} intensity={0.7} color={experience.accent} />
      <SceneContent experience={experience} stageIndex={stageIndex} />
      <OrbitControls
        enablePan={expanded}
        minDistance={experience.id === "qwalk" ? 5 : 4.2}
        maxDistance={experience.id === "qwalk" ? 9 : 7.4}
        autoRotate={!expanded}
        autoRotateSpeed={0.28}
        minPolarAngle={0.72}
        maxPolarAngle={1.42}
      />
    </Canvas>
  )
}
