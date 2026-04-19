import { HistoryEntry, getMultiplierColor } from '../lib/gameEngine';

interface RoundRecord extends HistoryEntry {
  betAmount?: number;
  cashedOut?: number;
  profit?: number;
}

interface RoundHistoryProps {
  history: RoundRecord[];
}

export function RoundHistory({ history }: RoundHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No rounds played yet. Start betting!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="grid grid-cols-4 gap-1 px-2 pb-1 text-xs text-muted-foreground"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span>Round</span>
        <span className="text-right">Crashed @</span>
        <span className="text-right">Your Bet</span>
        <span className="text-right">Result</span>
      </div>

      {history.map((entry, i) => {
        const color = getMultiplierColor(entry.multiplier);
        const won = !!entry.cashedOut;
        const lost = entry.betAmount && !entry.cashedOut;

        return (
          <div
            key={i}
            className="grid grid-cols-4 gap-1 px-2 py-2 rounded-lg items-center text-xs"
            style={{
              background: won
                ? 'rgba(34,197,94,0.07)'
                : lost
                ? 'rgba(239,68,68,0.07)'
                : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span className="text-muted-foreground">#{history.length - i}</span>

            <div className="text-right">
              <span className="font-bold" style={{ color }}>
                {entry.multiplier.toFixed(2)}x
              </span>
            </div>

            <div className="text-right text-muted-foreground">
              {entry.betAmount ? `$${entry.betAmount}` : '—'}
            </div>

            <div className="text-right">
              {won && entry.cashedOut && (
                <span className="text-green-400 font-semibold">
                  +${entry.profit?.toFixed(2)} @ {entry.cashedOut.toFixed(2)}x
                </span>
              )}
              {lost && (
                <span className="text-red-400 font-semibold">
                  -${entry.betAmount}
                </span>
              )}
              {!entry.betAmount && (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
