import { useEffect } from 'react'

export function useKeyboardControls(titleScreen: boolean, gameOver: boolean, paused: boolean, gameOverTime: number | null, onStart: () => void, onRestart: () => void, onPauseToggle: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (titleScreen) {
          onStart()
        } else if (gameOver) {
          const COOLDOWN_MS = 3000
          if (gameOverTime && Date.now() - gameOverTime >= COOLDOWN_MS) {
            onRestart()
          }
        } else if (paused) {
          onPauseToggle()
        }
      } else if (e.code === 'Escape') {
        if (!titleScreen && !gameOver && !paused) {
          onPauseToggle()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [titleScreen, gameOver, paused, gameOverTime, onStart, onRestart, onPauseToggle])
}
