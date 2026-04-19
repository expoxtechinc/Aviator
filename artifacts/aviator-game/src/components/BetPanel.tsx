import { GamePhase } from '../lib/gameEngine';

interface BetPanelProps {
  phase: GamePhase;
  betAmount: number;
  playerBet: number | null;
  playerCashedOut: number | null;
  balance: number;
  autoCashout: number | null;
  onPlaceBet: () => void;
  onCancelBet: () => void;
  onCashOut: () => void;
  onSetBetAmount: (amount: number) => void;
  onSetAutoCashout: (val: number | null) => void;
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 500];

export function BetPanel({
  phase,
  betAmount,
  playerBet,
  playerCashedOut,
  balance,
  autoCashout,
  onPlaceBet,
  onCancelBet,
  onCashOut,
  onSetBetAmount,
  onSetAutoCashout,
}: BetPanelProps) {
  const canBet = phase === 'waiting' && !playerBet && betAmount <= balance;
  const canCancel = phase === 'waiting' && !!playerBet;
  const canCashOut = phase === 'flying' && !!playerBet && !playerCashedOut;
  const hasBetInFlight = phase === 'flying' && !!playerBet && !playerCashedOut;

  const profit = playerCashedOut && playerBet ? Math.round((playerBet * playerCashedOut - playerBet) * 100) / 100 : null;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Bet Amount */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bet Amount</label>
          <span className="text-xs text-muted-foreground">Balance: <span className="text-foreground font-semibold">${balance.toFixed(2)}</span></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="w-8 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            onClick={() => onSetBetAmount(Math.max(1, betAmount - 1))}
            disabled={phase === 'flying' && !!playerBet}
          >-</button>

          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              value={betAmount}
              onChange={e => onSetBetAmount(Number(e.target.value))}
              min={1}
              max={balance}
              disabled={phase === 'flying' && !!playerBet}
              className="w-full pl-7 pr-3 py-2 text-center font-bold text-sm rounded-lg bg-background border border-border outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            className="w-8 h-9 rounded-lg text-sm font-bold flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            onClick={() => onSetBetAmount(betAmount + 1)}
            disabled={phase === 'flying' && !!playerBet}
          >+</button>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-1.5">
          {QUICK_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => onSetBetAmount(amt)}
              disabled={(phase === 'flying' && !!playerBet) || amt > balance}
              className="py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
              style={{
                background: betAmount === amt ? 'rgba(255,95,31,0.25)' : 'rgba(255,255,255,0.06)',
                border: betAmount === amt ? '1px solid rgba(255,95,31,0.5)' : '1px solid transparent',
                color: betAmount === amt ? '#ff5f1f' : undefined,
              }}
            >
              ${amt}
            </button>
          ))}
        </div>

        {/* Quick bet multipliers */}
        <div className="grid grid-cols-4 gap-1">
          {['½', '×2', 'Max', 'All'].map((label, i) => (
            <button
              key={label}
              onClick={() => {
                if (i === 0) onSetBetAmount(Math.max(1, Math.floor(betAmount / 2)));
                if (i === 1) onSetBetAmount(Math.min(betAmount * 2, balance));
                if (i === 2) onSetBetAmount(Math.min(500, balance));
                if (i === 3) onSetBetAmount(Math.floor(balance));
              }}
              disabled={phase === 'flying' && !!playerBet}
              className="py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Cashout */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex-shrink-0">Auto @</label>
        <div className="relative flex-1">
          <input
            type="number"
            placeholder="e.g. 2.00"
            value={autoCashout ?? ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              onSetAutoCashout(isNaN(v) || v < 1.01 ? null : v);
            }}
            min={1.01}
            step={0.1}
            className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary transition-colors"
          />
        </div>
        <span className="text-xs text-muted-foreground">x</span>
      </div>

      {/* Main Action Button */}
      <div className="relative">
        {hasBetInFlight && (
          <div className="absolute inset-0 rounded-xl opacity-30 animate-pulse"
            style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
        )}

        {canCashOut && (
          <button
            onClick={onCashOut}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all active:scale-95 glow-primary"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 0 30px rgba(34,197,94,0.5)',
            }}
          >
            Cash Out
          </button>
        )}

        {canCancel && (
          <button
            onClick={onCancelBet}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            }}
          >
            Cancel Bet
          </button>
        )}

        {canBet && (
          <button
            onClick={onPlaceBet}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all active:scale-95 glow-primary"
            style={{
              background: 'linear-gradient(135deg, #ff5f1f 0%, #dc2626 100%)',
              boxShadow: '0 0 20px rgba(255,95,31,0.4)',
            }}
          >
            Place Bet ${betAmount}
          </button>
        )}

        {!canBet && !canCancel && !canCashOut && phase === 'flying' && playerCashedOut && (
          <div
            className="w-full py-4 rounded-xl text-center font-black text-lg"
            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', color: '#22c55e' }}
          >
            +${profit?.toFixed(2)} Won at {playerCashedOut.toFixed(2)}x
          </div>
        )}

        {!canBet && !canCancel && !canCashOut && phase === 'crashed' && playerBet && !playerCashedOut && (
          <div
            className="w-full py-4 rounded-xl text-center font-black text-lg"
            style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
          >
            -${playerBet.toFixed(2)} Lost
          </div>
        )}

        {!canBet && !canCancel && !canCashOut && phase === 'waiting' && playerBet && (
          <button
            onClick={onCancelBet}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all active:scale-95"
            style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)', color: '#22c55e' }}
          >
            Bet Placed ${playerBet} ✓
          </button>
        )}

        {!canBet && !canCancel && !canCashOut && phase === 'crashed' && !playerBet && (
          <button
            disabled
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Wait for next round...
          </button>
        )}

        {!canBet && !canCancel && !canCashOut && phase === 'flying' && !playerBet && (
          <button
            disabled
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Round in progress
          </button>
        )}

        {betAmount > balance && phase === 'waiting' && !playerBet && (
          <button
            disabled
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Insufficient balance
          </button>
        )}
      </div>
    </div>
  );
}
