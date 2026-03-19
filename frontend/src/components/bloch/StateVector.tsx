import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface Props { x: number; y: number; z: number }

export function StateVector({ x, y, z }: Props) {
  const arrowRef = useRef<THREE.ArrowHelper>(null)

  useFrame(() => {
    if (!arrowRef.current) return
    const dir = new THREE.Vector3(x, z, y).normalize()  // three.js y-up swap
    arrowRef.current.setDirection(dir)
    arrowRef.current.setLength(0.9, 0.18, 0.07)
  })

  const dir = new THREE.Vector3(x, z, y).normalize()
  return (
    <primitive
      ref={arrowRef}
      object={new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,0), 0.9, 0x00d4ff, 0.18, 0.07)}
    />
  )
}
