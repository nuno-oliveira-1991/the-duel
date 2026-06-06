export default function PauseOverlay() {
  return (
    <>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '4px'
      }}>
        <h1 style={{ fontSize: '56px', fontWeight: 'bold', marginBottom: '24px', lineHeight: 1 }}>PAUSED</h1>
        <p style={{ fontSize: '24px', opacity: 0.9, letterSpacing: '4px' }}>
          Press Space to Resume
        </p>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textTransform: 'none',
        letterSpacing: '1px',
        opacity: 0.9,
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}>
        wasd to move • mouse to aim • click to shoot • esc to pause
      </div>
    </>
  )
}
