import { BetRecord } from '../lib/gameEngine';

interface LiveBetsProps {
  bets: BetRecord[];
  playerBet: number | null;
  playerCashedOut: number | null;
  playerName?: string;
}

export function LiveBets({ bets, playerBet, playerCashedOut, playerName = 'You' }: LiveBetsProps) {
  const playerEntry: BetRecord | null = playerBet
    ? {
        id: 'player',
        player: playerName,
        amount: playerBet,
        cashedOut: playerCashedOut ?? undefined,
        profit: playerCashedOut
          ? Math.round((playerBet * playerCashedOut - playerBet) * 100) / 100
          : undefined,
        status: playerCashedOut ? 'won' : 'active',
        avatar: '👤',
        targetCashout: 0,
      }
    : null;

  const allBets = playerEntry ? [playerEntry, ...bets] : bets;

  const activeBets = allBets.filter(b => b.status === 'active');
  const wonBets = allBets.filter(b => b.status === 'won').sort((a, b) => (b.cashedOut ?? 0) - (a.cashedOut ?? 0));
  const lostBets = allBets.filter(b => b.status === 'lost');

  const totalBet = allBets.reduce((s, b) => s + b.amount, 0);
  const totalWon = wonBets.reduce((s, b) => s + (b.profit ?? 0), 0);

  function Row({ bet, highlight }: { bet: BetRecord; highlight?: boolean }) {
    const isPlayer = bet.id === 'player';
    const isWon = bet.status === 'won';
    const isLost = bet.status === 'lost';

    return (
      <div
        className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all"
        style={{
          background: isPlayer
            ? 'rgba(255,95,31,0.1)'
            : isWon
              ? 'rgba(34,197,94,0.06)'
              : isLost
                ? 'rgba(239,68,68,0.05)'
                : 'rgba(255,255,255,0.03)',
          border: isPlayer
            ? '1px solid rgba(255,95,31,0.25)'
            : isWon
              ? '1px solid rgba(34,197,94,0.15)'
              : '1px solid rgba(255,255,255,0.05)',
          animation: isWon && highlight ? 'slideInLeft 0.25s ease-out' : undefined,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm leading-none">{bet.avatar || '🎮'}</span>
          <span
            className="truncate font-medium"
            style={{ color: isPlayer ? '#ff5f1f' : isWon ? '#22c55e' : undefined }}
          >
            {bet.player}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-muted-foreground">${bet.amount}</span>
          {isWon && bet.cashedOut && (
            <span
              className="font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}
            >
              +${bet.profit?.toFixed(2)} @ {bet.cashedOut.toFixed(2)}x
            </span>
          )}
          {isLost && (
            <span className="font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
              —
            </span>
          )}
          {bet.status === 'active' && (
            <span
              className="font-bold px-2 py-0.5 rounded-md animate-pulse"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
            >
              ●
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Players', value: allBets.length, color: 'rgba(255,255,255,0.7)' },
          { label: 'Active', value: activeBets.length, color: '#fbbf24' },
          { label: 'Cashed Out', value: wonBets.length, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {totalBet > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-muted-foreground">Total wagered: <span className="text-foreground font-bold">${totalBet.toLocaleString()}</span></span>
          {totalWon > 0 && <span className="text-green-400 font-bold">+${totalWon.toFixed(2)} paid out</span>}
        </div>
      )}

      {/* Live bets list */}
      <div className="flex flex-col gap-1" style={{ maxHeight: '280px', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {wonBets.length > 0 && (
          <>
            <div className="text-xs text-green-400/60 font-medium px-1 pt-1">Cashed out</div>
            {wonBets.slice(0, 10).map(bet => <Row key={bet.id} bet={bet} highlight />)}
          </>
        )}
        {activeBets.length > 0 && (
          <>
            <div className="text-xs text-yellow-400/60 font-medium px-1 pt-1">Still flying</div>
            {activeBets.map(bet => <Row key={bet.id} bet={bet} />)}
          </>
        )}
        {lostBets.length > 0 && (
          <>
            <div className="text-xs text-red-400/40 font-medium px-1 pt-1">Lost</div>
            {lostBets.slice(0, 5).map(bet => <Row key={bet.id} bet={bet} />)}
          </>
        )}
      </div>
    </div>
  );
}
