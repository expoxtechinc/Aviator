import { GamePhase } from '../lib/gameEngine';

interface PlaneProps {
  phase: GamePhase;
  multiplier: number;
}

export function Plane({ phase, multiplier }: PlaneProps) {
  if (phase === 'waiting') return null;

  return (
    <div
      className={`absolute pointer-events-none z-10 transition-all duration-100 ${phase === 'flying' ? 'plane-flying' : ''}`}
      style={{
        bottom: `${Math.min(70, 15 + (multiplier - 1) * 8)}%`,
        left: `${Math.min(60, 10 + (multiplier - 1) * 3)}%`,
        filter: phase === 'crashed' ? 'hue-rotate(0deg) saturate(3)' : 'none',
        transform: phase === 'crashed' ? 'rotate(20deg) scale(0.5)' : 'rotate(-5deg)',
        transition: phase === 'crashed' ? 'all 0.5s ease-out' : 'bottom 0.1s ease, left 0.1s ease',
      }}
    >
      <svg width="80" height="48" viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main fuselage */}
        <path
          d="M8 26 Q20 20 50 22 Q68 22 76 20 Q70 26 50 28 Q20 32 8 26Z"
          fill={phase === 'crashed' ? '#ef4444' : '#ffffff'}
          opacity={0.95}
        />
        {/* Cockpit */}
        <path
          d="M50 22 Q62 18 74 16 Q76 20 68 22 Q60 24 50 22Z"
          fill={phase === 'crashed' ? '#fca5a5' : '#93c5fd'}
          opacity={0.9}
        />
        {/* Main wing */}
        <path
          d="M30 24 Q38 14 48 10 Q50 12 46 20 L36 24Z"
          fill={phase === 'crashed' ? '#ef4444' : '#ff5f1f'}
        />
        <path
          d="M30 28 Q38 38 48 42 Q50 40 46 32 L36 28Z"
          fill={phase === 'crashed' ? '#ef4444' : '#ff5f1f'}
          opacity={0.8}
        />
        {/* Tail fin */}
        <path
          d="M8 26 Q12 20 16 16 Q18 18 16 24Z"
          fill={phase === 'crashed' ? '#ef4444' : '#ff5f1f'}
        />
        {/* Engine glow */}
        {phase === 'flying' && (
          <>
            <ellipse cx="10" cy="26" rx="4" ry="2" fill="#ff5f1f" opacity="0.8" />
            <ellipse cx="6" cy="26" rx="5" ry="1.5" fill="#fbbf24" opacity="0.6" />
            <ellipse cx="2" cy="26" rx="5" ry="1" fill="#fde68a" opacity="0.4" />
          </>
        )}
        {/* Window */}
        <circle cx="58" cy="21" r="2.5" fill="#bfdbfe" opacity="0.9" />
        <circle cx="66" cy="20" r="2" fill="#bfdbfe" opacity="0.7" />
      </svg>
      {/* Exhaust trail */}
      {phase === 'flying' && (
        <div
          className="absolute right-full top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ width: '60px', height: '8px', marginRight: '-4px' }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'linear-gradient(to left, rgba(255,95,31,0.6) 0%, rgba(251,191,36,0.3) 40%, transparent 100%)',
              filter: 'blur(2px)',
            }}
          />
        </div>
      )}
    </div>
  );
}
