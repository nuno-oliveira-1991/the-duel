import { useRef, useEffect } from 'react'
import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PlayerBoxProps {
  position: [number, number, number]
  onShoot: () => void
  onApiReady?: (api: any) => void
}

export default function PlayerBox({ position, onShoot, onApiReady }: PlayerBoxProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [1, 1, 1],
    angularFactor: [0, 1, 0],
    linearDamping: 0.99,
    angularDamping: 1,
  }))

  const keys = useRef({
    a: false,
    d: false,
    w: false,
    s: false,
    arrowLeft: false,
    arrowRight: false,
  })

  const rotation = useRef([0, 0, 0])
  const quaternion = useRef([0, 0, 0, 1])

  useEffect(() => {
    if (onApiReady) {
      onApiReady(api)
    }
  }, [api, onApiReady])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA': keys.current.a = true; break
        case 'KeyD': keys.current.d = true; break
        case 'KeyW': keys.current.w = true; break
        case 'KeyS': keys.current.s = true; break
        case 'ArrowLeft': keys.current.arrowLeft = true; break
        case 'ArrowRight': keys.current.arrowRight = true; break
        case 'Space': onShoot(); break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA': keys.current.a = false; break
        case 'KeyD': keys.current.d = false; break
        case 'KeyW': keys.current.w = false; break
        case 'KeyS': keys.current.s = false; break
        case 'ArrowLeft': keys.current.arrowLeft = false; break
        case 'ArrowRight': keys.current.arrowRight = false; break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    api.rotation.subscribe((r) => (rotation.current = r))
    api.quaternion.subscribe((q) => (quaternion.current = q))

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [api, onShoot])

  useFrame(() => {
    const moveSpeed = 1.2
    const rotateSpeed = 0.05

    // Cumulative directional controls (W=front/-Z, S=back/+Z, A=left/-X, D=right/+X)
    let vx = 0
    let vz = 0
    if (keys.current.w) vz -= moveSpeed
    if (keys.current.s) vz += moveSpeed
    if (keys.current.a) vx -= moveSpeed
    if (keys.current.d) vx += moveSpeed
    api.velocity.set(vx, 0, vz)

    // Rotation with arrow keys - use quaternion multiplication for unlimited rotation
    if (keys.current.arrowLeft || keys.current.arrowRight) {
      const delta = keys.current.arrowLeft ? rotateSpeed : -rotateSpeed
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), delta)
      const currentQ = new THREE.Quaternion(...quaternion.current as [number, number, number, number])
      currentQ.multiply(deltaQ)
      api.quaternion.set(currentQ.x, currentQ.y, currentQ.z, currentQ.w)
    }
  })

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00ff00" />
    </mesh>
  )
}
