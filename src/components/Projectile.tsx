import { useRef, useEffect } from 'react'
import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PROJECTILE_SIZE = 0.15
const MAX_DISTANCE = 8
const HIDDEN_Y = -10
const PROJECTILE_OFFSET = 0.6

interface ProjectileProps {
  mode: 'player' | 'enemy'
  getSpawnPosition?: () => [number, number, number]
  getDirection?: () => THREE.Vector3
  position?: [number, number, number]
  direction?: THREE.Vector3
  active: boolean
  onDeactivate: () => void
  onApiReady?: (api: any) => void
  ownerPositionRef?: React.MutableRefObject<THREE.Vector3>
  ownerRotationRef?: React.MutableRefObject<[number, number, number]>
}

export default function Projectile({
  mode,
  getSpawnPosition,
  getDirection,
  position,
  direction,
  active,
  onDeactivate,
  onApiReady,
  ownerPositionRef,
  ownerRotationRef
}: ProjectileProps) {
  const speed = mode === 'player' ? 12 : 10
  const color = mode === 'player' ? '#ff0000' : '#ff00ff'
  const initialPosition = mode === 'player' 
    ? (getSpawnPosition?.() || [0, 0, 0]) as [number, number, number]
    : [0, HIDDEN_Y, 0]

  const [ref, api] = useBox(() => ({
    mass: 0,
    position: initialPosition as [number, number, number],
    args: [PROJECTILE_SIZE, PROJECTILE_SIZE, PROJECTILE_SIZE],
    type: 'Kinematic',
  }))

  const travelPos = useRef(new THREE.Vector3())
  const initialPos = useRef(new THREE.Vector3())
  const firedDir = useRef(new THREE.Vector3(0, 0, -1))
  const isFired = useRef(false)
  const deactivated = useRef(false)
  const initialRotationSet = useRef(false)

  useEffect(() => {
    if (onApiReady) {
      onApiReady(api)
    }
  }, [onApiReady, api])

  useEffect(() => {
    if (active) {
      const spawn = mode === 'player' 
        ? (getSpawnPosition?.() || [0, 0, 0]) as [number, number, number]
        : (position || [0, 0, 0]) as [number, number, number]
      const dir = mode === 'player'
        ? getDirection?.() || new THREE.Vector3(0, 0, -1)
        : direction || new THREE.Vector3(0, 0, -1)
      
      initialPos.current.set(...spawn)
      travelPos.current.set(...spawn)
      firedDir.current = dir.clone()
      api.position.set(...spawn)
      isFired.current = true
      deactivated.current = false
    } else {
      isFired.current = false
      if (mode === 'enemy') {
        api.position.set(0, HIDDEN_Y, 0)
      }
    }
  }, [active, position, direction, mode, getSpawnPosition, getDirection])

  useFrame((_, delta) => {
    if (isFired.current && !deactivated.current) {
      travelPos.current.addScaledVector(firedDir.current, speed * delta)
      api.position.set(travelPos.current.x, travelPos.current.y, travelPos.current.z)

      if (travelPos.current.distanceTo(initialPos.current) >= MAX_DISTANCE) {
        deactivated.current = true
        isFired.current = false
        onDeactivate()
      }
    } else if (!active) {
      if (mode === 'player' && getSpawnPosition) {
        const p = getSpawnPosition()
        api.position.set(p[0], p[1], p[2])
        if (!initialRotationSet.current) {
          const currentPos = new THREE.Vector3(p[0], p[1], p[2])
          const center = new THREE.Vector3(0, 0, 0)
          const direction = new THREE.Vector3().subVectors(center, currentPos)
          direction.y = 0
          const angle = Math.atan2(direction.x, direction.z) + Math.PI
          const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0))
          api.quaternion.set(targetQ.x, targetQ.y, targetQ.z, targetQ.w)
          initialRotationSet.current = true
        }
      } else if (mode === 'enemy' && ownerPositionRef && ownerRotationRef) {
        const ownerPos = ownerPositionRef.current
        const ownerRot = ownerRotationRef.current
        const forward = new THREE.Vector3(0, 0, 1)
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(ownerRot[0], ownerRot[1], ownerRot[2]))
        forward.applyQuaternion(q)
        const offset = forward.multiplyScalar(PROJECTILE_OFFSET)
        api.position.set(ownerPos.x + offset.x, ownerPos.y + offset.y, ownerPos.z + offset.z)
        api.quaternion.set(q.x, q.y, q.z, q.w)
      }
    }
  })

  return (
    <mesh ref={ref as any} castShadow>
      <boxGeometry args={[PROJECTILE_SIZE, PROJECTILE_SIZE, PROJECTILE_SIZE]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
