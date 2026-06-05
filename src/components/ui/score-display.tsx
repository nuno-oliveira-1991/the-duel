interface ScoreDisplayProps {
  playerWins: number
  enemyWins: number
}

export default function ScoreDisplay({ playerWins, enemyWins }: ScoreDisplayProps) {
  return (
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
  )
}
