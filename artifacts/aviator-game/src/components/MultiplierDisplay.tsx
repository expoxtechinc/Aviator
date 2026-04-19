import { useEffect, useState } from 'react';
import { GamePhase, getMultiplierColor, formatMultiplier, getMultiplierLabel } from '../lib/gameEngine';

interface MultiplierDisplayProps {
  multiplier: number;
  phase: GamePhase;
  countdown: number;
}

export function MultiplierDisplay({ multiplier, phase, countdown }: MultiplierDisplayProps) {
  const [flash, setFlash] = useState(false);
  const [prevPhase, setPrevPhase] = useState<GamePhase>('waiting');

  useEffect(() => {
    if (prevPhase === 'flying' && phase === 'crashed') {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
    setPrevPhase(phase);
  }, [phase]);

  if (phase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {flash && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20"
            style={{ background: 'rgba(239,68,68,0.25)', animation: 'flashOut 0.6s ease-out forwards' }}
          />
        )}
        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-widest opacity-70">
          Next round in
        </div>
        <div
          className="font-black tabular-nums leading-none"
          style={{
            fontSize: '72px',
            color: '#ff5f1f',
            textShadow: '0 0 40px rgba(255,95,31,0.6), 0 0 80px rgba(255,95,31,0.2)',
          }}
        >
          {countdown}s
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="text-xs text-muted-foreground">Accepting bets...</span>
        </div>
      </div>
    );
  }

  if (phase === 'crashed') {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div
          className="text-red-400 text-sm font-black uppercase tracking-widest"
          style={{ animation: 'bounceIn 0.3s ease-out' }}
        >
          ✈ FLEW AWAY
        </div>
        <div
          className="font-black tabular-nums leading-none"
          style={{
            fontSize: '68px',
            color: '#ef4444',
            textShadow: '0 0 40px rgba(239,68,68,0.8), 0 0 80px rgba(239,68,68,0.3)',
            animation: 'crashShake 0.4s ease-out',
          }}
        >
          {formatMultiplier(multiplier)}
        </div>
        <div className="text-xs text-red-400/60 font-medium">Next round starting...</div>
      </div>
    );
  }

  const color = getMultiplierColor(multiplier);
  const label = getMultiplierLabel(multiplier);

  const isHot = multiplier >= 5;
  const isMoon = multiplier >= 50;
  const size = isMoon ? '80px' : isHot ? '76px' : '68px';

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      {label && (
        <div
          className="font-black uppercase tracking-widest px-3 py-0.5 rounded-full text-xs"
          style={{
            background: color + '25',
            color,
            border: `1px solid ${color}50`,
            textShadow: `0 0 10px ${color}`,
            boxShadow: `0 0 20px ${color}30`,
          }}
        >
          {label}
        </div>
      )}
      <div
        className="font-black tabular-nums leading-none select-none"
        style={{
          fontSize: size,
          color,
          textShadow: isMoon
            ? `0 0 20px ${color}, 0 0 60px ${color}80, 0 0 120px ${color}40`
            : isHot
              ? `0 0 20px ${color}cc, 0 0 50px ${color}50`
              : `0 0 30px ${color}80`,
          transition: 'color 0.3s ease, text-shadow 0.3s ease',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatMultiplier(multiplier)}
      </div>
    </div>
  );
}
