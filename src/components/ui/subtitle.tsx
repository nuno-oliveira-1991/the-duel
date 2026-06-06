interface SubtitleProps {
  text: string | null
}

export default function Subtitle({ text }: SubtitleProps) {
  if (!text) return null

  return (
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
      {text.toLowerCase()}
    </div>
  )
}
