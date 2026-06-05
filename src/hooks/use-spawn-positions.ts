import { useState } from 'react'

export function useSpawnPositions() {
  const [spawns, setSpawns] = useState(() => randomSpawnPositions())

  const randomizeSpawns = () => {
    setSpawns(randomSpawnPositions())
  }

  return { spawns, randomizeSpawns }
}

function randomSpawnPositions(): { player: [number, number, number], enemy: [number, number, number] } {
  const range = 3
  const minDistance = 5
  const px = (Math.random() - 0.5) * 2 * range
  const pz = (Math.random() - 0.5) * 2 * range
  let ex = (Math.random() - 0.5) * 2 * range
  let ez = (Math.random() - 0.5) * 2 * range
  while (Math.sqrt((ex - px) ** 2 + (ez - pz) ** 2) < minDistance) {
    ex = (Math.random() - 0.5) * 2 * range
    ez = (Math.random() - 0.5) * 2 * range
  }
  return { player: [px, 0, pz], enemy: [ex, 0, ez] }
}
