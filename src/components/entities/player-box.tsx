import { useRef, useEffect, useState } from 'react'
import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MIN_SHOOT_DISTANCE = 4
const MOVE_SPEED = 4
const ROTATE_SPEED = 0.05
const FLASH_DURATION = 0.15
const TOTAL_FLASHES = 3
const WARNING_DURATION = 200

interface PlayerBoxProps {
  position: [number, number, number]
  onShoot: () => void
  onApiReady?: (api: any) => void
  onHitApiReady?: (payload: { handleHit: (isFinalHit: boolean) => void }) => void
  gameActive?: boolean
  enemyPositionRef?: React.MutableRefObject<[number, number, number]>
}

export default function PlayerBox({ position, onShoot, onApiReady, onHitApiReady, gameActive = true, enemyPositionRef }: PlayerBoxProps) {
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
  const playerPosRef = useRef(position)
  const quaternion = useRef([0, 0, 0, 1])
  const [isFlickering, setIsFlickering] = useState(false)
  const [isFinalHit, setIsFinalHit] = useState(false)
  const [flickerOpacity, setFlickerOpacity] = useState(1)
  const [tooCloseWarning, setTooCloseWarning] = useState(false)
  const flickerTime = useRef(0)
  const unsubscribePosition = useRef<(() => void) | null>(null)
  const unsubscribeRotation = useRef<(() => void) | null>(null)
  const unsubscribeQuaternion = useRef<(() => void) | null>(null)
  const warningTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (onApiReady) {
      onApiReady(api)
      unsubscribePosition.current = api.position.subscribe((p: [number, number, number]) => {
        playerPosRef.current = p
      })
    }
    if (onHitApiReady) {
      onHitApiReady({ handleHit })
    }
    return () => {
      if (unsubscribePosition.current) unsubscribePosition.current()
      if (unsubscribeRotation.current) unsubscribeRotation.current()
      if (unsubscribeQuaternion.current) unsubscribeQuaternion.current()
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [api, onApiReady, onHitApiReady])

  const handleHit = (isFinalHit: boolean) => {
    setIsFlickering(true)
    setIsFinalHit(isFinalHit)
    flickerTime.current = 0
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA': keys.current.a = true; break
        case 'KeyD': keys.current.d = true; break
        case 'KeyW': keys.current.w = true; break
        case 'KeyS': keys.current.s = true; break
        case 'ArrowLeft': keys.current.arrowLeft = true; break
        case 'ArrowRight': keys.current.arrowRight = true; break
        case 'Space':
          if (gameActive) {
            const canShoot = !enemyPositionRef || (() => {
              const dx = enemyPositionRef.current[0] - playerPosRef.current[0]
              const dz = enemyPositionRef.current[2] - playerPosRef.current[2]
              const dist = Math.sqrt(dx * dx + dz * dz)
              return dist >= MIN_SHOOT_DISTANCE
            })()
            if (canShoot) {
              onShoot()
            } else {
              setTooCloseWarning(true)
              if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
              warningTimeoutRef.current = setTimeout(() => setTooCloseWarning(false), WARNING_DURATION)
            }
          }
          break
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

    unsubscribeRotation.current = api.rotation.subscribe((r) => (rotation.current = r))
    unsubscribeQuaternion.current = api.quaternion.subscribe((q) => (quaternion.current = q))

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [api, onShoot])

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

    if (!gameActive) {
      api.velocity.set(0, 0, 0)
      return
    }

    if (keys.current.arrowLeft || keys.current.arrowRight) {
      const delta = keys.current.arrowLeft ? ROTATE_SPEED : -ROTATE_SPEED
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), delta)
      const currentQ = new THREE.Quaternion(...quaternion.current as [number, number, number, number])
      currentQ.multiply(deltaQ)
      api.quaternion.set(currentQ.x, currentQ.y, currentQ.z, currentQ.w)
    }

    const q = new THREE.Quaternion(...quaternion.current as [number, number, number, number])
    let local = new THREE.Vector3()
    if (keys.current.w) local.z -= MOVE_SPEED
    if (keys.current.s) local.z += MOVE_SPEED
    if (keys.current.a) local.x -= MOVE_SPEED
    if (keys.current.d) local.x += MOVE_SPEED
    local.applyQuaternion(q)
    api.velocity.set(local.x, 0, local.z)
  })

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={
          isFlickering
            ? (isFinalHit ? '#ff0000' : '#ffffff')
            : tooCloseWarning
            ? '#ffaa00'
            : '#00ff00'
        }
        transparent={isFlickering}
        opacity={isFlickering ? flickerOpacity : 1}
      />
    </mesh>
  )
}
