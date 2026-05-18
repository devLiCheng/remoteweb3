// @ts-nocheck
import { useRef, useMemo, type FC } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

interface OrbProps {
  position: [number, number, number]
  color: string
  size: number
  phase?: number
}

function Orb({ position, color, size, phase = 0 }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(size, 32, 32), [size])
  const glowGeo = useMemo(() => new THREE.SphereGeometry(size * 1.8, 32, 32), [size])

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase
    const s = 0.8 + Math.sin(t * 1.3) * 0.2
    meshRef.current.scale.setScalar(s)
    glowRef.current.scale.setScalar(s * 1.1)
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={sphereGeo}>
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh ref={glowRef} geometry={glowGeo}>
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

function GlowingOrbs() {
  const orbs = useMemo(
    () => [
      { position: [2.5, 1.5, -2] as [number, number, number], color: '#F59E0B', size: 0.22, speed: 1.2, phase: 0 },
      { position: [-2.8, -0.5, 1.5] as [number, number, number], color: '#06B6D4', size: 0.25, speed: 0.8, phase: 1 },
      { position: [1.2, -2, -3] as [number, number, number], color: '#22D3EE', size: 0.3, speed: 1.5, phase: 2 },
      { position: [-1, 2.8, -1] as [number, number, number], color: '#00FFAA', size: 0.18, speed: 1.1, phase: 3 },
      { position: [3, -1, 2] as [number, number, number], color: '#06B6D4', size: 0.2, speed: 0.9, phase: 4 },
      { position: [-3, 0.8, -2.5] as [number, number, number], color: '#F59E0B', size: 0.16, speed: 1.3, phase: 5 },
      { position: [0.5, 3, -1.5] as [number, number, number], color: '#22D3EE', size: 0.24, speed: 1.0, phase: 0.5 },
      { position: [-1.5, -2.5, 2] as [number, number, number], color: '#00FFAA', size: 0.2, speed: 0.7, phase: 2.5 },
    ],
    [],
  )

  return (
    <>
      {orbs.map((orb, i) => (
        <Float key={i} speed={orb.speed} rotationIntensity={0.15} floatIntensity={0.3}>
          <Orb position={orb.position} color={orb.color} size={orb.size} phase={orb.phase} />
        </Float>
      ))}
    </>
  )
}

function TorusKnotGlow() {
  const groupRef = useRef<THREE.Group>(null!)

  const geometry = useMemo(() => new THREE.TorusKnotGeometry(1.2, 0.3, 200, 32), [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
      groupRef.current.rotation.x += delta * 0.15
      groupRef.current.rotation.z += delta * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#06B6D4" wireframe transparent opacity={0.9} />
      </mesh>
      <mesh geometry={geometry} scale={[0.97, 0.97, 0.97]}>
        <meshBasicMaterial color="#22D3EE" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh geometry={geometry} scale={[1.06, 1.06, 1.06]}>
        <meshBasicMaterial color="#06B6D4" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh geometry={geometry} scale={[1.12, 1.12, 1.12]}>
        <meshBasicMaterial color="#22D3EE" wireframe transparent opacity={0.06} />
      </mesh>
    </group>
  )
}

interface ParticleGroupProps {
  count: number
  color: string
  speed: number
  pulseSpeed: number
  baseSize: number
  spread: number
}

function ParticleGroup({ count, color, speed, pulseSpeed, baseSize, spread }: ParticleGroupProps) {
  const pointsRef = useRef<THREE.Points>(null!)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = spread * (0.4 + Math.random() * 0.6)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [count, spread])

  useFrame((state, delta) => {
    pointsRef.current.rotation.y += delta * speed
    pointsRef.current.rotation.x += delta * speed * 0.3
    const material = pointsRef.current.material as THREE.PointsMaterial
    material.size = baseSize + Math.sin(state.clock.elapsedTime * pulseSpeed) * baseSize * 0.35
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={baseSize}
        sizeAttenuation
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function StarField() {
  const ref = useRef<THREE.Points>(null!)

  const geometry = useMemo(() => {
    const count = 600
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.02
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#ffffff"
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#0A0A14']} />
      <ambientLight intensity={0.1} />
      <StarField />
      <TorusKnotGlow />
      <ParticleGroup count={120} color="#06B6D4" speed={0.08} pulseSpeed={1.5} baseSize={0.04} spread={6} />
      <ParticleGroup count={60} color="#00FFAA" speed={0.12} pulseSpeed={2.0} baseSize={0.03} spread={5} />
      <ParticleGroup count={40} color="#F59E0B" speed={0.15} pulseSpeed={2.5} baseSize={0.05} spread={4} />
      <GlowingOrbs />
    </>
  )
}

const ThreeBackground: FC = () => {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(10,10,20,0.6) 100%)',
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

export default ThreeBackground
