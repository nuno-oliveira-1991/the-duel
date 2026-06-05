import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import { useState, useRef, MutableRefObject } from 'react'
import * as THREE from 'three'
import Ground from './ground'
import PlayerBox from './entities/player-box'
import EnemyBox from './entities/enemy-box'
import Projectile from './projectile'
import HealthBar from './ui/health-bar'
import ScoreDisplay from './ui/score-display'
import TitleScreen from './ui/title-screen'
import GameOver from './ui/game-over'
import { useBox as useBoxCannon } from '@react-three/cannon'
import { useGameState } from '../hooks/use-game-state'
import { useKeyboardControls } from '../hooks/use-keyboard-controls'
import { useSpawnPositions } from '../hooks/use-spawn-positions'
import { useGameCollision } from '../hooks/use-game-collision'

const BOUND = 5.0
const WALL_THICKNESS = 0.2
const WALL_HEIGHT = 2
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

  useGameCollision({
    projectileActive,
    enemyProjectileActive,
    projectileApi,
    enemyProjectileApi,
    projectilePos,
    enemyProjectilePos,
    playerPos,
    enemyCurrentPos,
    playerHandleHit,
    enemyHandleHit,
    gameOver,
    enemyHealth,
    playerHealth,
    onEnemyHealthChange,
    onPlayerHealthChange,
    onGameOver,
    setProjectileActive,
    setEnemyProjectileActive
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
          mode="player"
          getSpawnPosition={getSpawnPosition}
          getDirection={getDirection}
          active={projectileActive}
          onDeactivate={handleProjectileDeactivate}
          onApiReady={handleProjectileApiReady}
        />
        {enemyCurrentPos.current && enemyRotationRef.current && (
          <Projectile
            mode="enemy"
            position={enemyProjectileSpawnPos.current || [0, 0, 0]}
            direction={enemyProjectileDirection.current || new THREE.Vector3(0, 0, -1)}
            active={enemyProjectileActive}
            onDeactivate={handleEnemyProjectileDeactivate}
            onApiReady={handleEnemyProjectileApiReady}
            ownerPositionRef={enemyCurrentPos.current}
            ownerRotationRef={enemyRotationRef.current}
          />
        )}
      </Physics>
    </>
  )
}

export default function GameScene() {
  const gameState = useGameState()
  const { spawns, randomizeSpawns } = useSpawnPositions()
  
  const handleStart = () => {
    gameState.setTitleScreen(false)
  }

  const handleRestart = () => {
    randomizeSpawns()
    gameState.handleRestart(spawns)
  }

  useKeyboardControls(gameState.titleScreen, gameState.gameOver, handleStart, handleRestart)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#000000' }}>
      <Canvas shadows style={{ width: '100%', height: '100%' }}>
        <GameContent 
          enemyHealth={gameState.enemyHealth}
          playerHealth={gameState.playerHealth}
          playerSpawn={spawns.player}
          enemySpawn={spawns.enemy}
          gameActive={gameState.gameActive}
          gameOver={gameState.gameOver}
          onEnemyHealthChange={gameState.setEnemyHealth} 
          onPlayerHealthChange={gameState.setPlayerHealth}
          onGameOver={gameState.handleGameOver}
          onPlayerApiReady={(api) => { gameState.playerApi.current = api }}
        />
      </Canvas>

      <HealthBar
        label="Player"
        current={gameState.playerHealth}
        max={5}
        mode="player"
        position="left"
      />
      <HealthBar
        label="Enemy"
        current={gameState.enemyHealth}
        max={20}
        mode="enemy"
        position="right"
      />
      <ScoreDisplay playerWins={gameState.playerWins} enemyWins={gameState.enemyWins} />
      {gameState.titleScreen && <TitleScreen />}
      {gameState.gameOver && gameState.winner && <GameOver winner={gameState.winner} />}
    </div>
  )
}
