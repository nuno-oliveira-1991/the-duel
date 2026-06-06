import { useRef, useEffect, useState } from 'react'
import { useBox } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const MIN_SHOOT_DISTANCE = 4
const MOVE_SPEED = 4
const FLASH_DURATION = 0.083
const TOTAL_FLASHES = 6

interface PlayerBoxProps {
  position: [number, number, number]
  onShoot: () => void
  onApiReady?: (api: any) => void
  onHitApiReady?: (payload: { handleHit: (isFinalHit: boolean) => void }) => void
  gameActive?: boolean
  enemyPositionRef?: React.MutableRefObject<[number, number, number]>
  onWarningChange?: (warning: string | null) => void
}

export default function PlayerBox({ position, onShoot, onApiReady, onHitApiReady, gameActive = true, enemyPositionRef, onWarningChange }: PlayerBoxProps) {
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
  })

  const rotation = useRef([0, 0, 0])

  const playerPosRef = useRef(position)
  const [isFlickering, setIsFlickering] = useState(false)
  const [initialRotationSet, setInitialRotationSet] = useState(false)
  const [isFinalHit, setIsFinalHit] = useState(false)
  const [flickerColor, setFlickerColor] = useState('#ffffff')
  const [tooCloseWarning, setTooCloseWarning] = useState(false)
  const flickerTime = useRef(0)
  const unsubscribePosition = useRef<(() => void) | null>(null)
  const unsubscribeRotation = useRef<(() => void) | null>(null)
  const unsubscribeQuaternion = useRef<(() => void) | null>(null)
  const warningTimeoutRef = useRef<number | null>(null)
  const { camera } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

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
    if (!isFlickering) {
      flickerTime.current = 0
    }
    setIsFlickering(true)
    setIsFinalHit(isFinalHit)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA': keys.current.a = true; break
        case 'KeyD': keys.current.d = true; break
        case 'KeyW': keys.current.w = true; break
        case 'KeyS': keys.current.s = true; break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyA': keys.current.a = false; break
        case 'KeyD': keys.current.d = false; break
        case 'KeyW': keys.current.w = false; break
        case 'KeyS': keys.current.s = false; break
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (gameActive && e.button === 0) {
        const canShoot = !enemyPositionRef || (() => {
          const dx = enemyPositionRef.current[0] - playerPosRef.current[0]
          const dz = enemyPositionRef.current[2] - playerPosRef.current[2]
          const dist = Math.sqrt(dx * dx + dz * dz)
          return dist >= MIN_SHOOT_DISTANCE
        })()
        if (canShoot) {
          onShoot()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)

    unsubscribeRotation.current = api.rotation.subscribe((r) => (rotation.current = r))

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [api, onShoot, gameActive, enemyPositionRef, onWarningChange])

  useFrame((_, delta) => {
    if (isFlickering) {
      flickerTime.current += delta
      const totalDuration = FLASH_DURATION * 2 * TOTAL_FLASHES
      const flashIndex = Math.floor(flickerTime.current / FLASH_DURATION)
      if (isFinalHit) {
        setFlickerColor(flashIndex % 2 === 0 ? '#ff0000' : '#00ff00')
      } else {
        setFlickerColor(flashIndex % 2 === 0 ? '#ffffff' : '#00ff00')
      }

      if (flickerTime.current > totalDuration) {
        setIsFlickering(false)
        setIsFinalHit(false)
        setFlickerColor('#ffffff')
      }
    }

    if (!gameActive) {
      api.velocity.set(0, 0, 0)
      if (!initialRotationSet) {
        const playerPos = new THREE.Vector3(...playerPosRef.current)
        const center = new THREE.Vector3(0, 0, 0)
        const direction = new THREE.Vector3().subVectors(center, playerPos)
        direction.y = 0
        const angle = Math.atan2(direction.x, direction.z)
        const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0))
        api.quaternion.set(targetQ.x, targetQ.y, targetQ.z, targetQ.w)
        setInitialRotationSet(true)
      }
      return
    }

    if (enemyPositionRef) {
      const dx = enemyPositionRef.current[0] - playerPosRef.current[0]
      const dz = enemyPositionRef.current[2] - playerPosRef.current[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      const isTooClose = dist < MIN_SHOOT_DISTANCE
      setTooCloseWarning(isTooClose)
      if (onWarningChange) {
        onWarningChange(isTooClose ? 'too close to shoot' : null)
      }
    }

    raycaster.current.setFromCamera(mouse.current, camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const targetPoint = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(plane, targetPoint)

    if (targetPoint) {
      const playerPos = new THREE.Vector3(...playerPosRef.current)
      const direction = new THREE.Vector3().subVectors(targetPoint, playerPos)
      direction.y = 0
      const angle = Math.atan2(direction.x, direction.z) + Math.PI
      const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0))
      api.quaternion.set(targetQ.x, targetQ.y, targetQ.z, targetQ.w)
    }

    const q = new THREE.Quaternion()
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
            ? flickerColor
            : tooCloseWarning
            ? '#ffaa00'
            : '#00ff00'
        }
      />
    </mesh>
  )
}
