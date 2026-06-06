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
  const [paused, setPaused] = useState(false)
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null)
  const [gameOverTime, setGameOverTime] = useState<number | null>(null)
  const playerApi = useRef<any>(null)
  const enemyApi = useRef<any>(null)

  const gameActive = !titleScreen && !gameOver && !paused

  const handleGameOver = (w: 'player' | 'enemy') => {
    setWinner(w)
    setGameOver(true)
    setGameOverTime(Date.now())
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
    setGameOverTime(null)
    if (playerApi.current) {
      playerApi.current.position.set(...newSpawns.player)
    }
    if (enemyApi.current) {
      enemyApi.current.position.set(...newSpawns.enemy)
    }
  }

  return {
    enemyHealth,
    playerHealth,
    playerWins,
    enemyWins,
    gameOver,
    titleScreen,
    paused,
    winner,
    gameOverTime,
    gameActive,
    playerApi,
    enemyApi,
    setEnemyHealth,
    setPlayerHealth,
    setTitleScreen,
    setPaused,
    handleGameOver,
    handleRestart
  }
}
