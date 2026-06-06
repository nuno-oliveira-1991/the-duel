import { useState, useEffect } from 'react'

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /android|ipad|iphone|ipod|windows phone|iemobile|blackberry|bada|meego|opera mini/i
      setIsMobile(mobileRegex.test(userAgent) || window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white',
        fontFamily: 'Arial, Helvetica, sans-serif',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Desktop Required
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: 1.6 }}>
          This game requires a desktop computer with a mouse and keyboard to play.
        </p>
      </div>
    </div>
  )
}
