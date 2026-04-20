import { Link } from 'wouter';
import { Game } from '../data/games';

interface GameCardProps {
  game: Game;
  size?: 'sm' | 'md' | 'lg';
}

const TAG_COLORS: Record<string, string> = {
  LIVE: '#22c55e',
  HOT: '#ef4444',
  NEW: '#06b6d4',
  MEGA: '#a855f7',
  JACKPOT: '#fbbf24',
  LOCAL: '#ff5f1f',
  TOURNAMENT: '#f59e0b',
  FAST: '#06b6d4',
};

export function GameCard({ game, size = 'md' }: GameCardProps) {
  const tagColor = game.tag ? TAG_COLORS[game.tag] ?? '#ff5f1f' : null;
  const isPlayable = game.playable;
  const href = game.id === 'aviator' ? '/play' : '#';

  const CardContent = (
    <div
      className="relative flex flex-col gap-2 p-3 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Tag */}
      {game.tag && tagColor && (
        <div
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-xs font-black uppercase z-10"
          style={{ background: tagColor + '25', color: tagColor, border: `1px solid ${tagColor}50`, fontSize: '9px' }}
        >
          {game.tag}
        </div>
      )}

      {/* Emoji icon */}
      <div
        className="w-full aspect-square rounded-xl flex items-center justify-center"
        style={{
          background: isPlayable
            ? 'linear-gradient(135deg, rgba(255,95,31,0.25), rgba(220,38,38,0.15))'
            : 'rgba(255,255,255,0.05)',
          fontSize: size === 'lg' ? '42px' : size === 'md' ? '32px' : '24px',
        }}
      >
        {game.emoji}
      </div>

      {/* Info */}
      <div>
        <div className="font-bold text-xs leading-tight truncate"
          style={{ color: isPlayable ? '#ff5f1f' : undefined }}>
          {game.name}
        </div>
        <div className="text-xs text-muted-foreground">{game.subcategory}</div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {game.players && <span>👥 {game.players}</span>}
        {game.rtp && game.rtp !== '-' && <span className="text-green-400/70">{game.rtp}</span>}
      </div>

      {/* Play overlay on hover */}
      <div
        className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(255,95,31,0.15)', backdropFilter: 'blur(2px)' }}
      >
        <div
          className="px-4 py-2 rounded-xl font-black text-sm"
          style={{
            background: isPlayable ? '#ff5f1f' : 'rgba(255,255,255,0.15)',
            color: isPlayable ? 'white' : 'rgba(255,255,255,0.8)',
          }}
        >
          {isPlayable ? '▶ Play Now' : '🔒 Coming Soon'}
        </div>
      </div>
    </div>
  );

  if (isPlayable) {
    return <Link href={href} className="no-underline" style={{ display: 'block' }}>{CardContent}</Link>;
  }

  return CardContent;
}
