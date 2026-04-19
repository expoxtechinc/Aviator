import { BetRecord } from '../lib/gameEngine';

interface LiveBetsProps {
  bets: BetRecord[];
  playerBet: number | null;
  playerCashedOut: number | null;
  playerName?: string;
}

export function LiveBets({ bets, playerBet, playerCashedOut, playerName = 'You' }: LiveBetsProps) {
  const allBets: BetRecord[] = playerBet
    ? [
        {
          id: 'player',
          player: playerName,
          amount: playerBet,
          cashedOut: playerCashedOut ?? undefined,
          profit: playerCashedOut ? Math.round((playerBet * playerCashedOut - playerBet) * 100) / 100 : undefined,
          status: playerCashedOut ? 'won' : 'active',
        },
        ...bets,
      ]
    : bets;

  return (
    <div className="flex flex-col gap-1.5" style={{ maxHeight: '240px', overflowY: 'auto' }}>
      {allBets.slice(0, 20).map((bet, i) => (
        <div
          key={bet.id}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background:
              bet.id === 'player'
                ? 'rgba(255,95,31,0.12)'
                : bet.status === 'won'
                ? 'rgba(34,197,94,0.08)'
                : bet.status === 'lost'
                ? 'rgba(239,68,68,0.06)'
                : 'rgba(255,255,255,0.04)',
            border:
              bet.id === 'player'
                ? '1px solid rgba(255,95,31,0.25)'
                : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background:
                  bet.id === 'player'
                    ? 'rgba(255,95,31,0.3)'
                    : `hsl(${(i * 47) % 360}, 60%, 35%)`,
              }}
            >
              {bet.player[0].toUpperCase()}
            </div>
            <span
              className="truncate font-medium text-xs"
              style={{ color: bet.id === 'player' ? '#ff5f1f' : undefined }}
            >
              {bet.player}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">${bet.amount}</span>

            {bet.status === 'won' && bet.cashedOut && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}
              >
                +${bet.profit?.toFixed(2)} @ {bet.cashedOut.toFixed(2)}x
              </span>
            )}
            {bet.status === 'lost' && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
              >
                LOST
              </span>
            )}
            {bet.status === 'active' && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md animate-pulse"
                style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}
              >
                ACTIVE
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
