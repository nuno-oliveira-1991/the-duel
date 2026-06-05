import { useRef, useEffect } from 'react'
import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProjectileProps {
  getSpawnPosition: () => [number, number, number]
  getDirection: () => THREE.Vector3
  active: boolean
  onDeactivate: () => void
  onApiReady?: (api: any) => void
}

export default function Projectile({ getSpawnPosition, getDirection, active, onDeactivate, onApiReady }: ProjectileProps) {
  const [ref, api] = useBox(() => ({
    mass: 0,
    position: getSpawnPosition(),
    args: [0.15, 0.15, 0.15],
    type: 'Kinematic',
  }))

  const travelPos = useRef(new THREE.Vector3())
  const initialPos = useRef(new THREE.Vector3())
  const firedDir = useRef(new THREE.Vector3(0, 0, -1))
  const isFired = useRef(false)
  const deactivated = useRef(false)
  const maxDistance = 8
  const speed = 12

  useEffect(() => {
    if (onApiReady) {
      onApiReady(api)
    }
  }, [onApiReady, api])

  useEffect(() => {
    if (active) {
      const spawn = getSpawnPosition()
      initialPos.current.set(...spawn)
      travelPos.current.set(...spawn)
      firedDir.current = getDirection().clone()
      api.position.set(...spawn)
      isFired.current = true
      deactivated.current = false
    } else {
      isFired.current = false
    }
  }, [active])

  useFrame((_, delta) => {
    if (isFired.current && !deactivated.current) {
      travelPos.current.addScaledVector(firedDir.current, speed * delta)
      api.position.set(travelPos.current.x, travelPos.current.y, travelPos.current.z)

      if (travelPos.current.distanceTo(initialPos.current) >= maxDistance) {
        deactivated.current = true
        isFired.current = false
        onDeactivate()
      }
    } else if (!active) {
      const p = getSpawnPosition()
      api.position.set(p[0], p[1], p[2])
    }
  })

  return (
    <mesh ref={ref as any} castShadow>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
  )
}
