import { HistoryEntry, getMultiplierColor } from '../lib/gameEngine';

interface HistoryBarProps {
  history: HistoryEntry[];
}

export function HistoryBar({ history }: HistoryBarProps) {
  if (history.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {history.slice(0, 20).map((entry, i) => {
        const color = getMultiplierColor(entry.multiplier);
        return (
          <div
            key={i}
            className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold cursor-default transition-all hover:scale-110"
            style={{
              background: color + '20',
              border: `1px solid ${color}50`,
              color,
              fontSize: '11px',
            }}
            title={new Date(entry.crashedAt).toLocaleTimeString()}
          >
            {entry.multiplier.toFixed(2)}x
          </div>
        );
      })}
    </div>
  );
}
