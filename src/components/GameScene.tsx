import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import { useState, useRef, MutableRefObject, useEffect } from 'react'
import * as THREE from 'three'
import Ground from './Ground'
import PlayerBox from './PlayerBox'
import EnemyBox from './EnemyBox'
import Projectile from './Projectile'
import EnemyProjectile from './EnemyProjectile'
import { useBox as useBoxCannon } from '@react-three/cannon'

const BOUND = 5.0
const WALL_THICKNESS = 0.2
const WALL_HEIGHT = 2
const PLAYER_MAX_HEALTH = 5
const ENEMY_MAX_HEALTH = 20
const COLLISION_DISTANCE = 1
const PROJECTILE_OFFSET = 0.8

function BoundaryWalls() {
  const wallArgs: [number, number, number] = [10, WALL_HEIGHT, WALL_THICKNESS]
  const sideArgs: [number, number, number] = [WALL_THICKNESS, WALL_HEIGHT, 10]
  const [refN] = useBoxCannon(() => ({ mass: 0, position: [0, 0.5, -BOUND], args: wallArgs }))
  const [refS] = useBoxCannon(() => ({ mass: 0, position: [0, 0.5, BOUND], args: wallArgs }))
  const [refE] = useBoxCannon(() => ({ mass: 0, position: [BOUND, 0.5, 0], args: sideArgs }))
  const [refW] = useBoxCannon(() => ({ mass: 0, position: [-BOUND, 0.5, 0], args: sideArgs }))
  return (
    <>
      <mesh ref={refN as any} visible={false}><boxGeometry args={wallArgs} /><meshStandardMaterial /></mesh>
      <mesh ref={refS as any} visible={false}><boxGeometry args={wallArgs} /><meshStandardMaterial /></mesh>
      <mesh ref={refE as any} visible={false}><boxGeometry args={sideArgs} /><meshStandardMaterial /></mesh>
      <mesh ref={refW as any} visible={false}><boxGeometry args={sideArgs} /><meshStandardMaterial /></mesh>
    </>
  )
}

function getPlayerHealthColor(current: number, max: number): string {
  if (current === max) return '#00ff00'
  if (current === max - 1) return '#ffff00'
  if (current === max - 2) return '#ffaa00'
  return '#ff0000'
}

function getEnemyHealthColor(current: number, max: number): string {
  const percentage = current / max
  if (percentage > 0.8) return '#00ff00'
  if (percentage > 0.5) return '#ffff00'
  if (percentage > 0.25) return '#ffaa00'
  return '#ff0000'
}

function randomSpawnPositions(): { player: [number, number, number], enemy: [number, number, number] } {
  const range = 3
  const minDistance = 5
  const px = (Math.random() - 0.5) * 2 * range
  const pz = (Math.random() - 0.5) * 2 * range
  let ex = (Math.random() - 0.5) * 2 * range
  let ez = (Math.random() - 0.5) * 2 * range
  while (Math.sqrt((ex - px) ** 2 + (ez - pz) ** 2) < minDistance) {
    ex = (Math.random() - 0.5) * 2 * range
    ez = (Math.random() - 0.5) * 2 * range
  }
  return { player: [px, 0, pz], enemy: [ex, 0, ez] }
}

interface GameContentProps {
  enemyHealth: number
  playerHealth: number
  playerSpawn: [number, number, number]
  enemySpawn: [number, number, number]
  gameActive: boolean
  gameOver: boolean
  onEnemyHealthChange: (health: number) => void
  onPlayerHealthChange: (health: number) => void
  onGameOver: (winner: 'player' | 'enemy') => void
  onPlayerApiReady: (api: any) => void
}

function GameContent({ enemyHealth, playerHealth, playerSpawn, enemySpawn, gameActive, gameOver, onEnemyHealthChange, onPlayerHealthChange, onGameOver, onPlayerApiReady }: GameContentProps) {
  const [projectileActive, setProjectileActive] = useState(false)
  const [enemyProjectileActive, setEnemyProjectileActive] = useState(false)
  const playerPos = useRef<[number, number, number]>([-3, 0, 3])
  const playerRot = useRef<[number, number, number]>([0, 0, 0])
  const enemyHandleHit = useRef<((isFinalHit: boolean) => void) | null>(null)
  const playerHandleHit = useRef<((isFinalHit: boolean) => void) | null>(null)
  const enemyCurrentPos = useRef<MutableRefObject<THREE.Vector3> | null>(null)
  const enemyRotationRef = useRef<MutableRefObject<[number, number, number]> | null>(null)
  const projectilePos = useRef(new THREE.Vector3())
  const projectileApi = useRef<any>(null)
  const enemyProjectileSpawnPos = useRef<[number, number, number] | null>(null)
  const enemyProjectileDirection = useRef<THREE.Vector3 | null>(null)
  const enemyProjectilePos = useRef(new THREE.Vector3())
  const enemyProjectileApi = useRef<any>(null)

  const handleApiReady = (api: any) => {
    onPlayerApiReady(api)
    api.position.subscribe((p: [number, number, number]) => {
      playerPos.current = p
    })
    api.rotation.subscribe((r: [number, number, number]) => {
      playerRot.current = r
    })
  }

  const handleEnemyApiReady = ({ handleHit, positionRef, rotationRef }: { handleHit: (isFinalHit: boolean) => void, positionRef: MutableRefObject<THREE.Vector3>, rotationRef: MutableRefObject<[number, number, number]> }) => {
    enemyHandleHit.current = handleHit
    enemyCurrentPos.current = positionRef
    enemyRotationRef.current = rotationRef
  }

  const handlePlayerApiReady = ({ handleHit }: { handleHit: (isFinalHit: boolean) => void }) => {
    playerHandleHit.current = handleHit
  }

  const handleProjectileApiReady = (api: any) => {
    projectileApi.current = api
    api.position.subscribe((p: [number, number, number]) => {
      projectilePos.current.set(p[0], p[1], p[2])
    })
  }

  const handleEnemyProjectileApiReady = (api: any) => {
    enemyProjectileApi.current = api
    api.position.subscribe((p: [number, number, number]) => {
      enemyProjectilePos.current.set(p[0], p[1], p[2])
    })
  }

  const getSpawnPosition = (): [number, number, number] => {
    const offset = new THREE.Vector3(0, 0, -PROJECTILE_OFFSET)
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...playerRot.current))
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
    const isFinalHit = enemyHealth - 1 === 0
    const newHealth = enemyHealth - 1
    onEnemyHealthChange(newHealth)
    if (enemyHandleHit.current) {
      enemyHandleHit.current(isFinalHit)
    }
    setProjectileActive(false)
    if (isFinalHit) {
      onGameOver('player')
    }
  }

  const handleEnemyShoot = (position: [number, number, number], direction: THREE.Vector3) => {
    if (!enemyProjectileActive) {
      enemyProjectileSpawnPos.current = position
      enemyProjectileDirection.current = direction
      setEnemyProjectileActive(true)
    }
  }

  const handleEnemyProjectileDeactivate = () => {
    setEnemyProjectileActive(false)
  }

  useFrame(() => {
    if (projectileActive && projectileApi.current && !gameOver && enemyCurrentPos.current) {
      if (projectilePos.current.distanceTo(enemyCurrentPos.current.current) < COLLISION_DISTANCE) {
        handleEnemyHit()
      }
    }
    
    if (enemyProjectileActive && enemyProjectileApi.current && !gameOver) {
      const playerPosVec = new THREE.Vector3(...playerPos.current)
      if (enemyProjectilePos.current.distanceTo(playerPosVec) < COLLISION_DISTANCE) {
        const isFinalHit = playerHealth - 1 === 0
        if (playerHandleHit.current) {
          playerHandleHit.current(isFinalHit)
        }
        const newPlayerHealth = playerHealth - 1
        onPlayerHealthChange(newPlayerHealth)
        setEnemyProjectileActive(false)
        if (isFinalHit) {
          onGameOver('enemy')
        }
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
        <BoundaryWalls />
        <PlayerBox
          position={playerSpawn}
          onShoot={handleShoot}
          onApiReady={handleApiReady}
          onHitApiReady={handlePlayerApiReady}
          gameActive={gameActive}
          enemyPositionRef={enemyCurrentPos.current ? { current: [enemyCurrentPos.current.current.x, enemyCurrentPos.current.current.y, enemyCurrentPos.current.current.z] } : undefined}
        />
        <EnemyBox 
          position={enemySpawn} 
          onApiReady={handleEnemyApiReady}
          playerPositionRef={playerPos}
          projectilePosRef={projectilePos}
          projectileActive={enemyProjectileActive}
          onEnemyShoot={handleEnemyShoot}
          gameActive={gameActive}
          onProjectileReturn={handleEnemyProjectileDeactivate}
        />
        <Projectile
          getSpawnPosition={getSpawnPosition}
          getDirection={getDirection}
          active={projectileActive}
          onDeactivate={handleProjectileDeactivate}
          onApiReady={handleProjectileApiReady}
        />
        {enemyCurrentPos.current && enemyRotationRef.current && (
          <EnemyProjectile
            position={enemyProjectileSpawnPos.current || [0, 0, 0]}
            direction={enemyProjectileDirection.current || new THREE.Vector3(0, 0, -1)}
            active={enemyProjectileActive}
            onDeactivate={handleEnemyProjectileDeactivate}
            onApiReady={handleEnemyProjectileApiReady}
            enemyPositionRef={enemyCurrentPos.current}
            enemyRotationRef={enemyRotationRef.current}
          />
        )}
      </Physics>
    </>
  )
}

export default function GameScene() {
  const [enemyHealth, setEnemyHealth] = useState(ENEMY_MAX_HEALTH)
  const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH)
  const [playerWins, setPlayerWins] = useState(0)
  const [enemyWins, setEnemyWins] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [titleScreen, setTitleScreen] = useState(true)
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null)
  const [spawns, setSpawns] = useState(() => randomSpawnPositions())
  const playerApi = useRef<any>(null)

  const gameActive = !titleScreen && !gameOver

  const handleGameOver = (w: 'player' | 'enemy') => {
    setWinner(w)
    setGameOver(true)
    if (w === 'player') {
      setPlayerWins(prev => prev + 1)
    } else {
      setEnemyWins(prev => prev + 1)
    }
  }

  const handleRestart = () => {
    const newSpawns = randomSpawnPositions()
    setSpawns(newSpawns)
    setEnemyHealth(ENEMY_MAX_HEALTH)
    setPlayerHealth(PLAYER_MAX_HEALTH)
    setGameOver(false)
    setWinner(null)
    if (playerApi.current) {
      playerApi.current.position.set(...newSpawns.player)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (titleScreen) {
          setTitleScreen(false)
        } else if (gameOver) {
          handleRestart()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [titleScreen, gameOver])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#000000' }}>
      <Canvas shadows style={{ width: '100%', height: '100%' }}>
        <GameContent 
          enemyHealth={enemyHealth}
          playerHealth={playerHealth}
          playerSpawn={spawns.player}
          enemySpawn={spawns.enemy}
          gameActive={gameActive}
          gameOver={gameOver}
          onEnemyHealthChange={setEnemyHealth} 
          onPlayerHealthChange={setPlayerHealth}
          onGameOver={handleGameOver}
          onPlayerApiReady={(api) => { playerApi.current = api }}
        />
      </Canvas>
      {/* Player Health */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Player:</span>
        <div style={{
          width: '150px',
          height: '20px',
          backgroundColor: '#333',
          borderRadius: '0',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(playerHealth / PLAYER_MAX_HEALTH) * 100}%`,
            height: '100%',
            backgroundColor: getPlayerHealthColor(playerHealth, PLAYER_MAX_HEALTH),
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }} />
        </div>
      </div>
      {/* Enemy Health */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Enemy:</span>
        <div style={{
          width: '150px',
          height: '20px',
          backgroundColor: '#333',
          borderRadius: '0',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(enemyHealth / ENEMY_MAX_HEALTH) * 100}%`,
            height: '100%',
            backgroundColor: getEnemyHealthColor(enemyHealth, ENEMY_MAX_HEALTH),
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }} />
        </div>
      </div>
      {/* Score */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{playerWins}</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>:</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{enemyWins}</span>
      </div>
      {/* Title Screen */}
      {titleScreen && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          userSelect: 'none',
          fontFamily: 'Arial, Helvetica, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '8px'
        }}>
          <h1 style={{ fontSize: '80px', fontWeight: 'bold', marginBottom: '24px', lineHeight: 1 }}>THE DUEL</h1>
          <p style={{ fontSize: '24px', opacity: 0.9, letterSpacing: '4px' }}>Press Space to Start</p>
        </div>
      )}
      {/* Game Over */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '50px',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Arial, Helvetica, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '4px'
        }}>
          <h1 style={{ fontSize: '56px', fontWeight: 'bold', marginBottom: '24px', lineHeight: 1 }}>
            {winner === 'player' ? 'Player Wins!' : 'Enemy Wins!'}
          </h1>
          <p style={{ fontSize: '24px', opacity: 0.9, letterSpacing: '4px' }}>
            Press Space to Continue
          </p>
        </div>
      )}
    </div>
  )
}
