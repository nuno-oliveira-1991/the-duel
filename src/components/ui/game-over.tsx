interface GameOverProps {
  winner: 'player' | 'enemy'
}

export default function GameOver({ winner }: GameOverProps) {
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
        Press Space to Continue
      </p>
    </div>
  )
}
