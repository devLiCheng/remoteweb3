import { useMemo, type FC } from 'react'

interface Dot {
  id: number
  left: string
  top: string
  size: number
  animationDelay: string
  animationDuration: string
  opacity: number
  color: string
}

const COLORS = ['#06B6D4', '#22D3EE', '#F59E0B', '#00FFAA']

function generateDots(count: number): Dot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 1.5 + Math.random() * 3.5,
    animationDelay: `${Math.random() * 6}s`,
    animationDuration: `${2.5 + Math.random() * 5}s`,
    opacity: 0.15 + Math.random() * 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))
}

const ParticleField: FC = () => {
  const dots = useMemo(() => generateDots(80), [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.08) 0%, transparent 70%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(251,191,36,0.04) 0%, transparent 50%)',
        }}
      />

      {dots.map((dot) => (
        <div
          key={dot.id}
          style={{
            position: 'absolute',
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            backgroundColor: dot.color,
            opacity: dot.opacity,
            animation: `particle ${dot.animationDuration} ease-in-out ${dot.animationDelay} infinite`,
            boxShadow: `0 0 ${dot.size * 4}px ${dot.color}`,
          }}
        />
      ))}

      <style>{`
        @keyframes particle {
          0%, 100% { opacity: 0.15; transform: translate(0, 0) scale(1); }
          25% { opacity: 0.45; transform: translate(6px, -10px) scale(1.8); }
          50% { opacity: 0.75; transform: translate(-4px, -18px) scale(2.2); }
          75% { opacity: 0.45; transform: translate(-8px, -6px) scale(1.8); }
        }
      `}</style>
    </div>
  )
}

export default ParticleField
