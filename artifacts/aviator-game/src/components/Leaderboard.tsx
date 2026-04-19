import { LeaderboardEntry } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  playerId: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function Leaderboard({ entries, playerId }: LeaderboardProps) {
  const top = entries.slice(0, 10);

  return (
    <div className="flex flex-col gap-2">
      {/* Column headers */}
      <div className="grid grid-cols-4 gap-1 px-2 pb-1"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-xs text-muted-foreground col-span-2">Player</span>
        <span className="text-xs text-muted-foreground text-right">Best x</span>
        <span className="text-xs text-muted-foreground text-right">Biggest Win</span>
      </div>

      {top.map((entry, i) => {
        const isPlayer = entry.id === playerId;
        const winRate = entry.totalGames > 0 ? Math.round((entry.totalWins / entry.totalGames) * 100) : 0;

        return (
          <div
            key={entry.id}
            className="grid grid-cols-4 gap-1 px-2 py-2 rounded-xl items-center transition-all"
            style={{
              background: isPlayer
                ? 'rgba(255,95,31,0.12)'
                : i === 0
                ? 'rgba(251,191,36,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: isPlayer
                ? '1px solid rgba(255,95,31,0.3)'
                : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center gap-1.5 col-span-2 min-w-0">
              <span className="text-sm w-5 text-center flex-shrink-0">
                {MEDALS[i] || <span className="text-xs text-muted-foreground">{i + 1}</span>}
              </span>
              <div className="min-w-0">
                <div
                  className="text-xs font-bold truncate"
                  style={{ color: isPlayer ? '#ff5f1f' : i === 0 ? '#fbbf24' : undefined }}
                >
                  {entry.name} {isPlayer && <span className="text-muted-foreground">(You)</span>}
                </div>
                <div className="text-xs text-muted-foreground">{winRate}% win • {entry.totalGames} rounds</div>
              </div>
            </div>

            <div className="text-right">
              <div
                className="text-xs font-black"
                style={{ color: entry.biggestMultiplier >= 10 ? '#a855f7' : entry.biggestMultiplier >= 5 ? '#22c55e' : '#fbbf24' }}
              >
                {entry.biggestMultiplier.toFixed(2)}x
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-green-400">
                ${entry.biggestWin.toLocaleString()}
              </div>
              <div className="text-xs"
                style={{ color: entry.totalProfit >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)' }}>
                {entry.totalProfit >= 0 ? '+' : ''}{entry.totalProfit.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
