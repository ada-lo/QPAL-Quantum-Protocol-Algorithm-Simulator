
import { useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { BlochVec } from "@/store/simStore"

interface Props { bv: BlochVec }

export function BlochScene({ bv }: Props) {
  const arrowRef = useRef<THREE.ArrowHelper | null>(null)
  const ringRef  = useRef<THREE.Mesh | null>(null)

  const purity = Math.sqrt(bv.x**2 + bv.y**2 + bv.z**2)
  const arrowColor = purity > 0.95 ? 0x00d4ff : purity > 0.5 ? 0xf59e0b : 0xef4444

  useFrame(() => {
    if (arrowRef.current) {
      const dir = new THREE.Vector3(bv.x, bv.z, -bv.y).normalize()
      arrowRef.current.setDirection(dir)
      arrowRef.current.setLength(purity * 0.88, 0.16, 0.07)
      // @ts-ignore
      arrowRef.current.line.material.color.setHex(arrowColor)
      // @ts-ignore
      arrowRef.current.cone.material.color.setHex(arrowColor)
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(purity)
    }
  })

  const dir = new THREE.Vector3(bv.x, bv.z, -bv.y).normalize()

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 3, 2]} intensity={0.7} />

      {/* Outer wireframe sphere */}
      <mesh>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#1a2640" wireframe opacity={0.25} transparent />
      </mesh>

      {/* Inner glass sphere */}
      <mesh>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#0a1220" transparent opacity={0.4} />
      </mesh>

      {/* Purity ring at equator */}
      <mesh ref={ringRef} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1, 0.012, 8, 64]} />
        <meshBasicMaterial color={arrowColor} transparent opacity={0.5} />
      </mesh>

      {/* Ghost sphere: visible when purity < 0.95 to show mixed-state boundary */}
      {purity < 0.95 && purity > 0.02 && (
        <mesh scale={[purity, purity, purity]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshBasicMaterial color={arrowColor} wireframe transparent opacity={0.18} />
        </mesh>
      )}
      {([
        [[1.25,0,0], 0xff4455],
        [[0,1.25,0], 0x10b981],
        [[0,0,1.25], 0x3b82f6],
      ] as [[number,number,number],number][]).map(([d, c], i) => (
        <primitive key={i} object={
          new THREE.ArrowHelper(
            new THREE.Vector3(...d).normalize(),
            new THREE.Vector3(0,0,0), 1.25,
            c, 0.1, 0.05
          )
        } />
      ))}

      {/* State vector arrow */}
      <primitive ref={arrowRef} object={
        new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,0), purity * 0.88, arrowColor, 0.16, 0.07)
      } />

      {/* Equatorial circles */}
      {[0, Math.PI/2].map((rot, i) => {
        const pts = Array.from({ length: 65 }, (_, k) => {
          const a = (k/64) * Math.PI * 2
          return i === 0
            ? new THREE.Vector3(Math.cos(a), Math.sin(a), 0)
            : new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
        })
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <primitive key={i} object={
            new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#1e3050", transparent: true, opacity: 0.5 }))
          } />
        )
      })}
    </>
  )
}
