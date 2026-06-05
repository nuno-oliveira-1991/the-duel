export default function TitleScreen() {
  return (
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
  )
}
