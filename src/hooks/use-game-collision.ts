import { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLLISION_DISTANCE = 1

interface UseGameCollisionProps {
  projectileActive: boolean
  enemyProjectileActive: boolean
  projectileApi: React.MutableRefObject<any>
  enemyProjectileApi: React.MutableRefObject<any>
  projectilePos: React.MutableRefObject<THREE.Vector3>
  enemyProjectilePos: React.MutableRefObject<THREE.Vector3>
  playerPos: React.MutableRefObject<[number, number, number]>
  enemyCurrentPos: React.MutableRefObject<MutableRefObject<THREE.Vector3> | null>
  playerHandleHit: React.MutableRefObject<((isFinalHit: boolean) => void) | null>
  enemyHandleHit: React.MutableRefObject<((isFinalHit: boolean) => void) | null>
  gameOver: boolean
  enemyHealth: number
  playerHealth: number
  onEnemyHealthChange: (health: number) => void
  onPlayerHealthChange: (health: number) => void
  onGameOver: (winner: 'player' | 'enemy') => void
  setProjectileActive: (active: boolean) => void
  setEnemyProjectileActive: (active: boolean) => void
}

export function useGameCollision({
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
}: UseGameCollisionProps) {
  useFrame(() => {
    if (projectileActive && projectileApi.current && !gameOver && enemyCurrentPos.current) {
      if (projectilePos.current.distanceTo(enemyCurrentPos.current.current) < COLLISION_DISTANCE) {
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
}
