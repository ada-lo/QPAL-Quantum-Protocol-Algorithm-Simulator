import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Line, OrbitControls, RoundedBox, Sphere, Text, Torus } from "@react-three/drei"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import type { LearningExperience } from "@/lib/quantum/learningCatalog"

function orbitalPoints(radius: number, y: number, count: number, phase = 0) {
  return Array.from({ length: count }, (_, index) => {
    const angle = phase + (index / count) * Math.PI * 2
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number]
  })
}

function PhotonStream({ accent, energy, lane }: { accent: string; energy: number; lane: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.z = -1.2 + (((clock.elapsedTime * 0.4 * energy) + lane * 0.15) % 2.4)
  })

  return (
    <group ref={ref} position={[-1.6 + lane * 0.7, 0.4 + lane * 0.08, -1.2]}>
      <Sphere args={[0.07, 18, 18]}>
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
      </Sphere>
      <Line
        points={[
          [0, 0, -0.4],
          [0, 0, 0.4],
        ]}
        color={accent}
        lineWidth={1.2}
        transparent
        opacity={0.7}
      />
    </group>
  )
}

function AmplitudeColumns({ accent, count }: { accent: string; count: number }) {
  const bars = useMemo(() => orbitalPoints(0.9, -0.55, count, Math.PI / 5), [count])
  return (
    <>
      {bars.map(([x, y, z], index) => {
        const height = 0.25 + ((index % 5) / 5) * 0.9
        return (
          <RoundedBox key={`${x}-${z}`} args={[0.09, height, 0.09]} radius={0.02} position={[x, y + height / 2, z]}>
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.15} roughness={0.2} />
          </RoundedBox>
        )
      })}
    </>
  )
}

function EntanglementRibbon({ accent, offset = 0 }: { accent: string; offset?: number }) {
  const points = useMemo(
    () =>
      [
        [-1.1, 0.35 + offset, -0.3],
        [-0.4, 0.8 + offset * 0.2, 0],
        [0.45, 0.1 + offset, 0.12],
        [1.1, 0.55 + offset * 0.15, -0.2],
      ] as [number, number, number][],
    [offset],
  )

  return <Line points={points} color={accent} lineWidth={2.4} transparent opacity={0.75} />
}

function QuantumScene({ experience }: { experience: LearningExperience }) {
  const rig = useRef<THREE.Group>(null)
  const supportTint =
    experience.support === "implemented"
      ? "#22c55e"
      : experience.support === "demo"
        ? "#f59e0b"
        : "#ef4444"

  useFrame(({ clock }) => {
    if (!rig.current) return
    rig.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.18
  })

  return (
    <group ref={rig}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.3} color="#ffffff" />
      <pointLight position={[-2, 1.5, 2]} intensity={1.2} color={experience.accent} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <meshBasicMaterial color="#08111f" />
      </mesh>
      <Torus args={[1.55, 0.015, 12, 80]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={experience.accent} emissive={experience.accent} emissiveIntensity={0.25} />
      </Torus>
      <Torus args={[1.95, 0.02, 12, 120]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#152238" transparent opacity={0.8} />
      </Torus>

      {orbitalPoints(1.35, 0.2, Math.max(experience.nQubits, 3)).map(([x, y, z], index) => (
        <Float key={`${experience.id}-${index}`} speed={1.5 + index * 0.15} rotationIntensity={0.35} floatIntensity={0.6}>
          <group position={[x, y + (index % 2) * 0.12, z]}>
            <Sphere args={[0.17, 28, 28]}>
              <meshStandardMaterial color="#d8f3ff" roughness={0.15} metalness={0.2} />
            </Sphere>
            <Sphere args={[0.045, 16, 16]} position={[0.1, 0.08, 0.02]}>
              <meshStandardMaterial color={experience.accent} emissive={experience.accent} emissiveIntensity={0.65} />
            </Sphere>
          </group>
        </Float>
      ))}

      <EntanglementRibbon accent={experience.accent} />
      {experience.kind === "protocol" && <EntanglementRibbon accent={supportTint} offset={-0.22} />}
      {experience.kind === "protocol" &&
        Array.from({ length: 4 }, (_, index) => (
          <PhotonStream key={index} accent={experience.accent} energy={1 + index * 0.15} lane={index} />
        ))}
      {experience.kind === "algorithm" && <AmplitudeColumns accent={experience.accent} count={12} />}

      <RoundedBox args={[1.45, 0.18, 0.45]} radius={0.05} position={[0, 1.15, 0]}>
        <meshStandardMaterial color="#091321" metalness={0.25} roughness={0.35} />
      </RoundedBox>
      <Text
        position={[0, 1.18, 0.24]}
        fontSize={0.14}
        color={experience.accent}
        anchorX="center"
        anchorY="middle"
      >
        {experience.label}
      </Text>
      <Text
        position={[0, 0.9, 0.01]}
        fontSize={0.1}
        color={supportTint}
        anchorX="center"
        anchorY="middle"
      >
        {experience.support.toUpperCase()}
      </Text>
    </group>
  )
}

export function QuantumShowcase3D({ experience }: { experience: LearningExperience }) {
  return (
    <Canvas camera={{ position: [0, 1.1, 3.8], fov: 42 }}>
      <color attach="background" args={["#040915"]} />
      <fog attach="fog" args={["#040915", 3.8, 7.5]} />
      <QuantumScene experience={experience} />
      <OrbitControls enablePan={false} minDistance={3.2} maxDistance={5.5} autoRotate autoRotateSpeed={0.6} />
    </Canvas>
  )
}
