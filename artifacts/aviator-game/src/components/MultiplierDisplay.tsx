import { GamePhase, getMultiplierColor, formatMultiplier, getMultiplierLabel } from '../lib/gameEngine';

interface MultiplierDisplayProps {
  multiplier: number;
  phase: GamePhase;
  countdown: number;
}

export function MultiplierDisplay({ multiplier, phase, countdown }: MultiplierDisplayProps) {
  if (phase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Next round in
        </div>
        <div
          className="text-7xl font-black tabular-nums"
          style={{ color: '#ff5f1f', textShadow: '0 0 30px rgba(255,95,31,0.5)' }}
        >
          {countdown}s
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Placing bets...</span>
        </div>
      </div>
    );
  }

  if (phase === 'crashed') {
    return (
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="text-red-400 text-sm font-bold uppercase tracking-widest animate-bounce">
          FLEW AWAY
        </div>
        <div
          className="text-6xl md:text-7xl font-black tabular-nums"
          style={{
            color: '#ef4444',
            textShadow: '0 0 40px rgba(239,68,68,0.6)',
          }}
        >
          {formatMultiplier(multiplier)}
        </div>
      </div>
    );
  }

  const color = getMultiplierColor(multiplier);
  const label = getMultiplierLabel(multiplier);

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      {label && (
        <div
          className="text-xs font-black uppercase tracking-widest px-3 py-0.5 rounded-full"
          style={{ background: color + '30', color, border: `1px solid ${color}50` }}
        >
          {label}
        </div>
      )}
      <div
        className="text-6xl md:text-8xl font-black tabular-nums multiplier-active select-none"
        style={{
          color,
          textShadow: `0 0 40px ${color}80, 0 0 80px ${color}30`,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatMultiplier(multiplier)}
      </div>
    </div>
  );
}
