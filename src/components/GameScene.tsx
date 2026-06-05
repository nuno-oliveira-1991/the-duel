import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import { useState, useRef } from 'react'
import * as THREE from 'three'
import Ground from './Ground'
import PlayerBox from './PlayerBox'
import EnemyBox from './EnemyBox'
import Projectile from './Projectile'

interface GameContentProps {
  onEnemyHealthChange: (health: number) => void
}

function GameContent({ onEnemyHealthChange }: GameContentProps) {
  const [projectileActive, setProjectileActive] = useState(false)
  const [enemyHealth, setEnemyHealth] = useState(5)
  const playerPos = useRef<[number, number, number]>([-3, 0, 3])
  const playerRot = useRef<[number, number, number]>([0, 0, 0])
  const enemyHandleHit = useRef<(() => void) | null>(null)
  const projectilePos = useRef(new THREE.Vector3())
  const projectileApi = useRef<any>(null)

  const handleApiReady = (api: any) => {
    api.position.subscribe((p: [number, number, number]) => {
      playerPos.current = p
    })
    api.rotation.subscribe((r: [number, number, number]) => {
      playerRot.current = r
    })
  }

  const handleEnemyApiReady = ({ handleHit }: { handleHit: () => void }) => {
    enemyHandleHit.current = handleHit
  }

  const handleProjectileApiReady = (api: any) => {
    projectileApi.current = api
    api.position.subscribe((p: [number, number, number]) => {
      projectilePos.current.set(p[0], p[1], p[2])
    })
  }

  const getSpawnPosition = (): [number, number, number] => {
    const offsetDistance = 0.8
    const offset = new THREE.Vector3(0, 0, -offsetDistance)
    const quaternion = new THREE.Quaternion()
    quaternion.setFromEuler(new THREE.Euler(...playerRot.current))
    offset.applyQuaternion(quaternion)
    return [
      playerPos.current[0] + offset.x,
      playerPos.current[1] + offset.y,
      playerPos.current[2] + offset.z,
    ]
  }

  const getDirection = (): THREE.Vector3 => {
    const quaternion = new THREE.Quaternion()
    quaternion.setFromEuler(new THREE.Euler(...playerRot.current))
    return new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion)
  }

  const handleShoot = () => {
    if (!projectileActive) {
      setProjectileActive(true)
    }
  }

  const handleProjectileDeactivate = () => {
    setProjectileActive(false)
  }

  const handleEnemyHit = () => {
    const newHealth = enemyHealth - 1
    setEnemyHealth(newHealth)
    onEnemyHealthChange(newHealth)
    if (enemyHandleHit.current) {
      enemyHandleHit.current()
    }
    setProjectileActive(false)
  }

  // Collision detection between projectile and enemy
  useFrame(() => {
    if (projectileActive && projectileApi.current) {
      // Simple distance-based collision
      const enemyPos = new THREE.Vector3(3, 0, -3)
      if (projectilePos.current.distanceTo(enemyPos) < 1) {
        handleEnemyHit()
      }
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 12, 10]} />
      <OrbitControls />
      
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[0, 3, 2]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <Physics gravity={[0, -9.82, 0]}>
        <Ground />
        <PlayerBox 
          position={[-3, 0, 3]} 
          onShoot={handleShoot}
          onApiReady={handleApiReady}
        />
        <EnemyBox 
          position={[3, 0, -3]} 
          onApiReady={handleEnemyApiReady}
        />
        <Projectile
          getSpawnPosition={getSpawnPosition}
          getDirection={getDirection}
          active={projectileActive}
          onDeactivate={handleProjectileDeactivate}
          onApiReady={handleProjectileApiReady}
        />
      </Physics>
    </>
  )
}

export default function GameScene() {
  const [enemyHealth, setEnemyHealth] = useState(5)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows style={{ width: '100%', height: '100%' }}>
        <GameContent onEnemyHealthChange={setEnemyHealth} />
      </Canvas>
      {/* UI Energy Bar */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <span style={{ color: 'white', fontSize: '14px' }}>Enemy Health:</span>
        <div style={{
          width: '200px',
          height: '20px',
          backgroundColor: '#333',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(enemyHealth / 5) * 100}%`,
            height: '100%',
            backgroundColor: '#00ff00',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{ color: 'white', fontSize: '14px' }}>{enemyHealth}/5</span>
      </div>
    </div>
  )
}
