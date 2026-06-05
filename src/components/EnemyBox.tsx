import { useBox } from '@react-three/cannon'
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'

interface EnemyBoxProps {
  position: [number, number, number]
  onHit?: () => void
  onApiReady?: (api: any) => void
}

export default function EnemyBox({ position, onHit, onApiReady }: EnemyBoxProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [1, 1, 1],
  }))

  const [isFlickering, setIsFlickering] = useState(false)
  const flickerTime = useRef(0)

  useEffect(() => {
    const unsub = api.position.subscribe((p) => {
      if (p[1] < -5) {
        api.position.set(...position)
        api.velocity.set(0, 0, 0)
      }
    })
    return unsub
  }, [api, position])

  const handleHit = () => {
    console.log('hit')
    setIsFlickering(true)
    flickerTime.current = 0
    if (onHit) onHit()
  }

  useFrame((_, delta) => {
    if (isFlickering) {
      flickerTime.current += delta
      if (flickerTime.current > 0.3) {
        setIsFlickering(false)
      }
    }
  })

  useEffect(() => {
    if (onApiReady) {
      onApiReady({ api, handleHit })
    }
  }, [onApiReady, api])

  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={isFlickering ? '#ffffff' : '#0000ff'} 
        transparent={isFlickering}
        opacity={isFlickering ? 0.5 : 1}
      />
    </mesh>
  )
}