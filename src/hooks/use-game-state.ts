import { useState, useRef } from 'react'

const PLAYER_MAX_HEALTH = 5
const ENEMY_MAX_HEALTH = 20

export function useGameState() {
  const [enemyHealth, setEnemyHealth] = useState(ENEMY_MAX_HEALTH)
  const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH)
  const [playerWins, setPlayerWins] = useState(0)
  const [enemyWins, setEnemyWins] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [titleScreen, setTitleScreen] = useState(true)
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null)
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

  const handleRestart = (newSpawns: { player: [number, number, number], enemy: [number, number, number] }) => {
    setEnemyHealth(ENEMY_MAX_HEALTH)
    setPlayerHealth(PLAYER_MAX_HEALTH)
    setGameOver(false)
    setWinner(null)
    if (playerApi.current) {
      playerApi.current.position.set(...newSpawns.player)
    }
  }

  return {
    enemyHealth,
    playerHealth,
    playerWins,
    enemyWins,
    gameOver,
    titleScreen,
    winner,
    gameActive,
    playerApi,
    setEnemyHealth,
    setPlayerHealth,
    setTitleScreen,
    handleGameOver,
    handleRestart
  }
}
