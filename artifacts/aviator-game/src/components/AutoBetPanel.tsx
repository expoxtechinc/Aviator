interface AutoBetPanelProps {
  autoBet: boolean;
  autoBetAmount: number;
  autoCashout: number | null;
  balance: number;
  onToggleAutoBet: () => void;
  onSetAutoBetAmount: (v: number) => void;
  onSetAutoCashout: (v: number | null) => void;
}

export function AutoBetPanel({
  autoBet,
  autoBetAmount,
  autoCashout,
  balance,
  onToggleAutoBet,
  onSetAutoBetAmount,
  onSetAutoCashout,
}: AutoBetPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Auto Bet</span>
        <button
          onClick={onToggleAutoBet}
          className="relative w-11 h-6 rounded-full transition-all focus:outline-none"
          style={{ background: autoBet ? '#ff5f1f' : 'rgba(255,255,255,0.1)' }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: autoBet ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {autoBet && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-20">Bet per round</label>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={autoBetAmount}
                onChange={e => onSetAutoBetAmount(Number(e.target.value))}
                min={1}
                max={balance}
                className="w-full pl-7 pr-3 py-2 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-20">Auto cashout</label>
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="e.g. 2.00"
                value={autoCashout ?? ''}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  onSetAutoCashout(isNaN(v) || v < 1.01 ? null : v);
                }}
                step={0.1}
                min={1.01}
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border outline-none focus:border-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground">x</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Auto bet will place a ${autoBetAmount} bet each round
            {autoCashout ? ` and cash out at ${autoCashout}x` : ''}.
          </p>
        </div>
      )}
    </div>
  );
}
