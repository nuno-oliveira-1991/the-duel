import { useRef, useEffect } from 'react'
import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PROJECTILE_SIZE = 0.15
const MAX_DISTANCE = 8
const SPEED = 10
const HIDDEN_Y = -10
const PROJECTILE_OFFSET = 0.6

interface EnemyProjectileProps {
  position: [number, number, number]
  direction: THREE.Vector3
  active: boolean
  onDeactivate: () => void
  onApiReady?: (api: any) => void
  enemyPositionRef?: React.MutableRefObject<THREE.Vector3>
  enemyRotationRef?: React.MutableRefObject<[number, number, number]>
}

export default function EnemyProjectile({ position, direction, active, onDeactivate, onApiReady, enemyPositionRef, enemyRotationRef }: EnemyProjectileProps) {
  const [ref, api] = useBox(() => ({
    mass: 0,
    position: [0, HIDDEN_Y, 0],
    args: [PROJECTILE_SIZE, PROJECTILE_SIZE, PROJECTILE_SIZE],
    type: 'Kinematic',
  }))

  const travelPos = useRef(new THREE.Vector3())
  const initialPos = useRef(new THREE.Vector3())
  const firedDir = useRef(new THREE.Vector3(0, 0, -1))
  const isFired = useRef(false)
  const deactivated = useRef(false)

  useEffect(() => {
    if (onApiReady) {
      onApiReady(api)
    }
  }, [onApiReady, api])

  useEffect(() => {
    if (active) {
      initialPos.current.set(...position)
      travelPos.current.set(...position)
      firedDir.current = direction.clone()
      api.position.set(...position)
      isFired.current = true
      deactivated.current = false
    } else {
      isFired.current = false
      api.position.set(0, HIDDEN_Y, 0)
    }
  }, [active, position, direction])

  useFrame((_, delta) => {
    if (isFired.current && !deactivated.current) {
      travelPos.current.addScaledVector(firedDir.current, SPEED * delta)
      api.position.set(travelPos.current.x, travelPos.current.y, travelPos.current.z)

      if (travelPos.current.distanceTo(initialPos.current) >= MAX_DISTANCE) {
        deactivated.current = true
        isFired.current = false
        onDeactivate()
      }
    } else if (!active && enemyPositionRef && enemyRotationRef) {
      const enemyPos = enemyPositionRef.current
      const enemyRot = enemyRotationRef.current
      const forward = new THREE.Vector3(0, 0, 1)
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(enemyRot[0], enemyRot[1], enemyRot[2]))
      forward.applyQuaternion(q)
      const offset = forward.multiplyScalar(PROJECTILE_OFFSET)
      api.position.set(enemyPos.x + offset.x, enemyPos.y + offset.y, enemyPos.z + offset.z)
      api.quaternion.set(q.x, q.y, q.z, q.w)
    }
  })

  return (
    <mesh ref={ref as any} castShadow>
      <boxGeometry args={[PROJECTILE_SIZE, PROJECTILE_SIZE, PROJECTILE_SIZE]} />
      <meshStandardMaterial color="#ff00ff" />
    </mesh>
  )
}
