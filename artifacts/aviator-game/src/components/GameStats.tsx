import { HistoryEntry, getMultiplierColor } from '../lib/gameEngine';

interface GameStatsProps {
  history: HistoryEntry[];
}

function calcStats(history: HistoryEntry[]) {
  if (history.length === 0) return null;
  const vals = history.map(h => h.multiplier);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const under2 = vals.filter(v => v < 2).length;
  const under5 = vals.filter(v => v >= 2 && v < 5).length;
  const under10 = vals.filter(v => v >= 5 && v < 10).length;
  const over10 = vals.filter(v => v >= 10).length;
  return { avg, max, min, under2, under5, under10, over10, total: vals.length };
}

interface BarProps { label: string; count: number; total: number; color: string; }
function Bar({ label, count, total, color }: BarProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-12 text-right flex-shrink-0" style={{ color }}>{label}</span>
      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color, opacity: 0.75 }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-10 flex-shrink-0">
        {count} ({pct.toFixed(0)}%)
      </span>
    </div>
  );
}

export function GameStats({ history }: GameStatsProps) {
  const stats = calcStats(history);

  if (!stats) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Play a few rounds to see statistics
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Average', value: stats.avg.toFixed(2) + 'x', color: getMultiplierColor(stats.avg) },
          { label: 'Highest', value: stats.max.toFixed(2) + 'x', color: getMultiplierColor(stats.max) },
          { label: 'Lowest', value: stats.min.toFixed(2) + 'x', color: getMultiplierColor(stats.min) },
        ].map(card => (
          <div key={card.label} className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
            <div className="text-base font-black" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Distribution */}
      <div className="flex flex-col gap-1.5">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Crash Distribution ({stats.total} rounds)
        </div>
        <Bar label="< 2x" count={stats.under2} total={stats.total} color="#ef4444" />
        <Bar label="2x–5x" count={stats.under5} total={stats.total} color="#f59e0b" />
        <Bar label="5x–10x" count={stats.under10} total={stats.total} color="#22c55e" />
        <Bar label="10x+" count={stats.over10} total={stats.total} color="#a855f7" />
      </div>

      {/* Insight */}
      <div className="rounded-xl p-3 text-xs"
        style={{ background: 'rgba(255,95,31,0.08)', border: '1px solid rgba(255,95,31,0.2)' }}>
        <span className="text-primary font-semibold">Tip: </span>
        <span className="text-muted-foreground">
          {stats.under2 / stats.total > 0.4
            ? `${((stats.under2 / stats.total) * 100).toFixed(0)}% of rounds crashed under 2x. Consider cashing out early!`
            : `The average crash is ${stats.avg.toFixed(2)}x. Set auto-cashout around ${Math.min(stats.avg * 0.85, 1.8).toFixed(2)}x for consistent returns.`}
        </span>
      </div>
    </div>
  );
}
