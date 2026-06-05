import { useBox } from '@react-three/cannon'

export default function Ground() {
  const [ref] = useBox(() => ({
    mass: 0,
    position: [0, -0.55, 0],
    args: [10, 0.05, 10],
  }))

  return (
    <mesh ref={ref as any} receiveShadow>
      <boxGeometry args={[10, 0.05, 10]} />
      <meshStandardMaterial color="#808080" />
    </mesh>
  )
}
