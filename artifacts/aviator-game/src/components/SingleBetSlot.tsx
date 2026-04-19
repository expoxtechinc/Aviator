import { GamePhase } from '../lib/gameEngine';

interface SingleBetSlotProps {
  slotLabel: string;
  phase: GamePhase;
  betAmount: number;
  isActive: boolean;
  cashedOut: number | null;
  balance: number;
  autoCashout: number | null;
  color?: string;
  onPlaceBet: () => void;
  onCancelBet: () => void;
  onCashOut: () => void;
  onSetBetAmount: (amount: number) => void;
  onSetAutoCashout: (val: number | null) => void;
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 500];

export function SingleBetSlot({
  slotLabel,
  phase,
  betAmount,
  isActive,
  cashedOut,
  balance,
  autoCashout,
  color = '#ff5f1f',
  onPlaceBet,
  onCancelBet,
  onCashOut,
  onSetBetAmount,
  onSetAutoCashout,
}: SingleBetSlotProps) {
  const locked = phase === 'flying' && isActive;
  const canBet = phase === 'waiting' && !isActive && betAmount <= balance;
  const canCancel = phase === 'waiting' && isActive;
  const canCashOut = phase === 'flying' && isActive && !cashedOut;
  const profit = cashedOut && isActive ? Math.round((betAmount * cashedOut - betAmount) * 100) / 100 : null;

  return (
    <div
      className="flex flex-col gap-2.5 p-3 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive && !cashedOut ? color + '40' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Slot header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
          {slotLabel}
        </span>
        {isActive && !cashedOut && phase === 'flying' && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* Amount input */}
      <div className="flex items-center gap-1.5">
        <button
          disabled={locked}
          onClick={() => onSetBetAmount(Math.max(1, betAmount - 1))}
          className="w-7 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >-</button>
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
          <input
            type="number"
            value={betAmount}
            onChange={e => onSetBetAmount(Number(e.target.value))}
            min={1}
            disabled={locked}
            className="w-full pl-5 pr-2 py-1.5 text-center text-sm font-bold rounded-lg bg-background border border-border outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>
        <button
          disabled={locked}
          onClick={() => onSetBetAmount(betAmount + 1)}
          className="w-7 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >+</button>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-3 gap-1">
        {QUICK_AMOUNTS.map(amt => (
          <button
            key={amt}
            onClick={() => onSetBetAmount(amt)}
            disabled={locked || amt > balance}
            className="py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
            style={{
              background: betAmount === amt ? `${color}25` : 'rgba(255,255,255,0.06)',
              border: betAmount === amt ? `1px solid ${color}50` : '1px solid transparent',
              color: betAmount === amt ? color : undefined,
            }}
          >
            ${amt}
          </button>
        ))}
      </div>

      {/* Quick multipliers */}
      <div className="grid grid-cols-4 gap-1">
        {[['½', () => onSetBetAmount(Math.max(1, Math.floor(betAmount / 2)))],
          ['×2', () => onSetBetAmount(Math.min(betAmount * 2, balance))],
          ['Max', () => onSetBetAmount(Math.min(500, balance))],
          ['All', () => onSetBetAmount(Math.floor(balance))]] .map(([label, fn]) => (
          <button
            key={label as string}
            onClick={fn as () => void}
            disabled={locked}
            className="py-0.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {label as string}
          </button>
        ))}
      </div>

      {/* Auto cashout */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground flex-shrink-0">Auto @</label>
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
          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-background border border-border outline-none focus:border-primary"
        />
        <span className="text-xs text-muted-foreground">x</span>
      </div>

      {/* CTA */}
      {canCashOut && (
        <button
          onClick={onCashOut}
          className="w-full py-3 rounded-xl font-black text-base uppercase tracking-wider transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            boxShadow: '0 0 24px rgba(34,197,94,0.4)',
          }}
        >
          CASH OUT
        </button>
      )}

      {canCancel && (
        <button
          onClick={onCancelBet}
          className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-wider transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
        >
          Cancel Bet
        </button>
      )}

      {canBet && (
        <button
          onClick={onPlaceBet}
          className="w-full py-3 rounded-xl font-black text-base uppercase tracking-wider transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 20px ${color}50`,
          }}
        >
          BET ${betAmount}
        </button>
      )}

      {!canBet && !canCancel && !canCashOut && isActive && cashedOut && (
        <div className="w-full py-3 rounded-xl text-center font-black text-base"
          style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', color: '#22c55e' }}>
          +${profit?.toFixed(2)} @ {cashedOut.toFixed(2)}x
        </div>
      )}

      {!canBet && !canCancel && !canCashOut && phase === 'crashed' && isActive && !cashedOut && (
        <div className="w-full py-3 rounded-xl text-center font-black text-base"
          style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
          -${betAmount} Lost
        </div>
      )}

      {!canBet && !canCancel && !canCashOut && !isActive && (
        <button disabled className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-wider opacity-40"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          {phase === 'waiting' ? (betAmount > balance ? 'Insufficient balance' : 'Ready') : 'Round in progress'}
        </button>
      )}

      {phase === 'waiting' && isActive && (
        <button
          onClick={onCancelBet}
          className="w-full py-3 rounded-xl font-black text-base uppercase tracking-wider transition-all active:scale-95"
          style={{
            background: 'rgba(34,197,94,0.2)',
            border: '2px solid rgba(34,197,94,0.4)',
            color: '#22c55e',
          }}
        >
          Bet Placed ${betAmount} ✓ (Cancel)
        </button>
      )}
    </div>
  );
}
