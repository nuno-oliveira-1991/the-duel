import { useState } from 'react'

export function useSpawnPositions() {
  const [spawns, setSpawns] = useState(() => randomSpawnPositions())

  const randomizeSpawns = () => {
    const newSpawns = randomSpawnPositions()
    setSpawns(newSpawns)
    return newSpawns
  }

  return { spawns, randomizeSpawns }
}

function randomSpawnPositions(): { player: [number, number, number], enemy: [number, number, number] } {
  const corners = [
    [-4, -4],
    [-4, 4],
    [4, -4],
    [4, 4]
  ]

  const shuffled = corners.sort(() => Math.random() - 0.5)
  const playerCorner = shuffled[0]
  const enemyCorner = shuffled[1]

  const playerOffset = 0.5
  const enemyOffset = 0.5

  const result = {
    player: [playerCorner[0] + playerOffset, 0, playerCorner[1] + playerOffset] as [number, number, number],
    enemy: [enemyCorner[0] + enemyOffset, 0, enemyCorner[1] + enemyOffset] as [number, number, number]
  }

  return result
}
