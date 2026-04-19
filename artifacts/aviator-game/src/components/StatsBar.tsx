interface StatsBarProps {
  balance: number;
  totalWon: number;
  totalLost: number;
  onAddBalance: (amount: number) => void;
}

export function StatsBar({ balance, totalWon, totalLost, onAddBalance }: StatsBarProps) {
  const total = totalWon + totalLost;
  const winRate = total > 0 ? Math.round((totalWon / total) * 100) : 0;

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Balance</div>
          <div className="text-base font-black" style={{ color: '#ff5f1f' }}>${balance.toFixed(2)}</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <div className="text-xs text-muted-foreground">Wins</div>
          <div className="text-base font-bold text-green-400">{totalWon}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Losses</div>
          <div className="text-base font-bold text-red-400">{totalLost}</div>
        </div>
        {total > 0 && (
          <div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
            <div className="text-base font-bold text-muted-foreground">{winRate}%</div>
          </div>
        )}
      </div>
      <button
        onClick={() => onAddBalance(1000)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95"
        style={{ background: 'rgba(255,95,31,0.2)', border: '1px solid rgba(255,95,31,0.4)', color: '#ff5f1f' }}
      >
        + $1000
      </button>
    </div>
  );
}
