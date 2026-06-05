import { useBox } from '@react-three/cannon'
import { useRef, useEffect, useState, MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
// @ts-ignore
import * as YUKA from 'yuka'
import * as THREE from 'three'

const GROUND_BOUNDS = { minX: -4.5, maxX: 4.5, minZ: -4.5, maxZ: 4.5 }
const DESIRED_DISTANCE = 4
const SHOOT_RANGE = 8
const SHOOT_COOLDOWN = 2
const MIN_SHOOT_DISTANCE = 4
const MAX_SPEED = 3
const MAX_FORCE = 6
const PROJECTILE_FLEE_RADIUS = 3
const Y_FIXED = 0
const FLASH_DURATION = 0.15
const TOTAL_FLASHES = 3
const WANDER_INTERVAL = 2
const WANDER_RANGE = 8
const WANDER_WEIGHT = 0.6
const FLEE_WEIGHT = 0.8
const PROJECTILE_FLEE_WEIGHT = 2.5
const PROJECTILE_RETURN_DELAY = 0.1
const WARNING_DURATION = 200
const PROJECTILE_SPAWN_OFFSET = 0.8
const ROTATION_SMOOTHING = 10

interface EnemyBoxProps {
  position: [number, number, number]
  onHit?: () => void
  onApiReady?: (payload: { handleHit: (isFinalHit: boolean) => void, positionRef: MutableRefObject<THREE.Vector3>, rotationRef: MutableRefObject<[number, number, number]> }) => void
  playerPositionRef?: MutableRefObject<[number, number, number]>
  projectilePosRef?: MutableRefObject<THREE.Vector3>
  projectileActive?: boolean
  onEnemyShoot?: (position: [number, number, number], direction: THREE.Vector3) => void
  gameActive?: boolean
  onProjectileReturn?: () => void
}

export default function EnemyBox({ position, onHit, onApiReady, playerPositionRef, projectilePosRef, projectileActive, onEnemyShoot, gameActive = true, onProjectileReturn }: EnemyBoxProps) {
  const [ref, api] = useBox(() => ({
    mass: 0,
    position,
    args: [1, 1, 1],
    type: 'Kinematic',
  }))

  const groupRef = useRef<THREE.Group>(null)
  const rotationRef = useRef<[number, number, number]>([0, 0, 0])
  const [isFlickering, setIsFlickering] = useState(false)
  const [isFinalHit, setIsFinalHit] = useState(false)
  const [flickerOpacity, setFlickerOpacity] = useState(1)
  const [tooCloseWarning, setTooCloseWarning] = useState(false)
  const flickerTime = useRef(0)
  const warningTimeoutRef = useRef<number | null>(null)

  const onEnemyShootRef = useRef(onEnemyShoot)
  useEffect(() => { onEnemyShootRef.current = onEnemyShoot }, [onEnemyShoot])
  const vehicle = useRef<any>(null)
  const manager = useRef<any>(null)
  const shootCooldown = useRef(SHOOT_COOLDOWN)
  const currentPos = useRef(new THREE.Vector3(position[0], Y_FIXED, position[2]))
  const wanderTarget = useRef<any>(null)
  const wanderTimer = useRef(0)
  const returnDelay = useRef(0)

  useEffect(() => {
    const mgr = new YUKA.EntityManager()
    const v = new YUKA.Vehicle()
    v.position.set(position[0], Y_FIXED, position[2])
    v.maxSpeed = MAX_SPEED
    v.maxForce = MAX_FORCE
    mgr.add(v)
    manager.current = mgr
    vehicle.current = v

    return () => { mgr.clear() }
  }, [])

  const handleHit = (isFinalHit: boolean) => {
    setIsFlickering(true)
    setIsFinalHit(isFinalHit)
    flickerTime.current = 0
    if (onHit) onHit()
  }

  useEffect(() => {
    if (onApiReady) onApiReady({ handleHit, positionRef: currentPos, rotationRef })
  }, [onApiReady])

  useEffect(() => {
    if (!projectileActive && onProjectileReturn) {
      returnDelay.current = PROJECTILE_RETURN_DELAY
    }
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [projectileActive, onProjectileReturn])

  useFrame((_, delta) => {
    if (isFlickering) {
      flickerTime.current += delta
      const totalDuration = FLASH_DURATION * 2 * TOTAL_FLASHES
      const flashIndex = Math.floor(flickerTime.current / FLASH_DURATION)
      setFlickerOpacity(flashIndex % 2 === 0 ? 0.5 : 1)
      
      if (flickerTime.current > totalDuration) {
        setIsFlickering(false)
        setIsFinalHit(false)
        setFlickerOpacity(1)
      }
    }

    if (!gameActive) return

    const v = vehicle.current
    const mgr = manager.current
    if (!v || !mgr) return

    const pp = playerPositionRef?.current
    const projPos = projectilePosRef?.current

    v.steering.clear()

    wanderTimer.current += delta
    if (wanderTimer.current > WANDER_INTERVAL) {
      wanderTimer.current = 0
      const randomX = (Math.random() - 0.5) * WANDER_RANGE
      const randomZ = (Math.random() - 0.5) * WANDER_RANGE
      wanderTarget.current = new YUKA.Vector3(randomX, Y_FIXED, randomZ)
    }
    if (wanderTarget.current) {
      const wander = new YUKA.SeekBehavior(wanderTarget.current)
      wander.weight = WANDER_WEIGHT
      v.steering.add(wander)
    }

    if (pp) {
      const target = new YUKA.Vector3(pp[0], Y_FIXED, pp[2])
      const dist = v.position.distanceTo(target)
      if (dist > DESIRED_DISTANCE + 1) {
        v.steering.add(new YUKA.SeekBehavior(target))
      } else if (dist < DESIRED_DISTANCE - 1) {
        const flee = new YUKA.FleeBehavior(target)
        flee.weight = FLEE_WEIGHT
        v.steering.add(flee)
      }
    }

    if (projectileActive && projPos) {
      const projYuka = new YUKA.Vector3(projPos.x, Y_FIXED, projPos.z)
      if (v.position.distanceTo(projYuka) < PROJECTILE_FLEE_RADIUS) {
        const flee = new YUKA.FleeBehavior(projYuka)
        flee.weight = PROJECTILE_FLEE_WEIGHT
        v.steering.add(flee)
      }
    }

    mgr.update(delta)

    v.position.y = Y_FIXED
    v.velocity.y = 0

    v.position.x = Math.max(GROUND_BOUNDS.minX, Math.min(GROUND_BOUNDS.maxX, v.position.x))
    v.position.z = Math.max(GROUND_BOUNDS.minZ, Math.min(GROUND_BOUNDS.maxZ, v.position.z))

    currentPos.current.set(v.position.x, Y_FIXED, v.position.z)
    api.position.set(v.position.x, Y_FIXED, v.position.z)

    if (groupRef.current) {
      groupRef.current.position.set(v.position.x, Y_FIXED, v.position.z)
      if (pp) {
        const dx = pp[0] - v.position.x
        const dz = pp[2] - v.position.z
        const angle = Math.atan2(dx, dz)
        const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0))
        groupRef.current.quaternion.slerp(targetQ, ROTATION_SMOOTHING * delta)
        const euler = new THREE.Euler().setFromQuaternion(targetQ)
        rotationRef.current = [euler.x, euler.y, euler.z]
      }
    }

    shootCooldown.current -= delta
    returnDelay.current -= delta
    if (pp && onEnemyShootRef.current && shootCooldown.current <= 0 && returnDelay.current <= 0) {
      const dx = pp[0] - v.position.x
      const dz = pp[2] - v.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < SHOOT_RANGE && dist >= MIN_SHOOT_DISTANCE) {
        const direction = new THREE.Vector3(dx, 0, dz).normalize()
        onEnemyShootRef.current(
          [v.position.x + direction.x * PROJECTILE_SPAWN_OFFSET, Y_FIXED, v.position.z + direction.z * PROJECTILE_SPAWN_OFFSET],
          direction
        )
        shootCooldown.current = SHOOT_COOLDOWN
      } else if (dist < MIN_SHOOT_DISTANCE) {
        setTooCloseWarning(true)
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
        warningTimeoutRef.current = setTimeout(() => setTooCloseWarning(false), WARNING_DURATION)
      }
    }
  })

  return (
    <>
      <mesh ref={ref as any} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </mesh>
      <group ref={groupRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={
              isFlickering
                ? (isFinalHit ? '#ff0000' : '#ffffff')
                : tooCloseWarning
                ? '#ffaa00'
                : '#0000ff'
            }
            transparent={isFlickering}
            opacity={isFlickering ? flickerOpacity : 1}
          />
        </mesh>
      </group>
    </>
  )
}