interface HealthBarProps {
  label: string
  current: number
  max: number
  mode: 'player' | 'enemy'
  position: 'left' | 'right'
}

function getHealthColor(current: number, max: number, mode: 'player' | 'enemy'): string {
  if (mode === 'player') {
    if (current === max) return '#00ff00'
    if (current === max - 1) return '#ffff00'
    if (current === max - 2) return '#ffaa00'
    return '#ff0000'
  } else {
    const percentage = current / max
    if (percentage > 0.8) return '#00ff00'
    if (percentage > 0.5) return '#ffff00'
    if (percentage > 0.25) return '#ffaa00'
    return '#ff0000'
  }
}

export default function HealthBar({ label, current, max, mode, position }: HealthBarProps) {
  const positionStyle = position === 'left' 
    ? { top: '20px', left: '20px' }
    : { top: '20px', right: '20px' }

  return (
    <div style={{
      position: 'absolute',
      ...positionStyle,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '2px'
    }}>
      <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{label}:</span>
      <div style={{
        width: '150px',
        height: '20px',
        backgroundColor: '#333',
        borderRadius: '0',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(current / max) * 100}%`,
          height: '100%',
          backgroundColor: getHealthColor(current, max, mode),
          transition: 'width 0.3s ease, background-color 0.3s ease'
        }} />
      </div>
    </div>
  )
}
