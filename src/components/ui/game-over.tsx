import { useState, useEffect } from 'react'

interface GameOverProps {
  winner: 'player' | 'enemy'
  gameOverTime: number | null
}

export default function GameOver({ winner, gameOverTime }: GameOverProps) {
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (!gameOverTime) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - gameOverTime
      const remaining = Math.max(0, 3 - Math.floor(elapsed / 1000))
      setCountdown(remaining > 0 ? remaining : null)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 100)

    return () => clearInterval(interval)
  }, [gameOverTime])

  return (
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
        {countdown !== null ? countdown : 'Press Space to Continue'}
      </p>
    </div>
  )
}
