import { useEffect } from 'react'

export function useKeyboardControls(titleScreen: boolean, gameOver: boolean, onStart: () => void, onRestart: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (titleScreen) {
          onStart()
        } else if (gameOver) {
          onRestart()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [titleScreen, gameOver, onStart, onRestart])
}
