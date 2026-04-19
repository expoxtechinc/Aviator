import { HistoryEntry, getMultiplierColor } from '../lib/gameEngine';

interface HistoryBarProps {
  history: HistoryEntry[];
}

function getEmoji(mult: number): string {
  if (mult >= 100) return '🌕';
  if (mult >= 50) return '💎';
  if (mult >= 20) return '🚀';
  if (mult >= 10) return '🔥';
  if (mult >= 5) return '⚡';
  if (mult >= 2) return '';
  return '';
}

export function HistoryBar({ history }: HistoryBarProps) {
  if (history.length === 0) return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-xs text-muted-foreground/50">Awaiting rounds...</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {history.slice(0, 22).map((entry, i) => {
        const color = getMultiplierColor(entry.multiplier);
        const emoji = getEmoji(entry.multiplier);
        const isNew = i === 0;
        return (
          <div
            key={`${entry.crashedAt.getTime()}-${i}`}
            className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold cursor-default whitespace-nowrap"
            style={{
              background: color + '18',
              border: `1px solid ${color}45`,
              color,
              fontSize: '11px',
              boxShadow: entry.multiplier >= 5 ? `0 0 8px ${color}30` : undefined,
              animation: isNew ? 'slideInLeft 0.3s ease-out' : undefined,
            }}
            title={`${entry.multiplier.toFixed(2)}x @ ${new Date(entry.crashedAt).toLocaleTimeString()}`}
          >
            {emoji && <span className="mr-0.5">{emoji}</span>}
            {entry.multiplier.toFixed(2)}x
          </div>
        );
      })}
    </div>
  );
}
