import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { CrashGraph } from '../components/CrashGraph';
import { MultiplierDisplay } from '../components/MultiplierDisplay';
import { Plane } from '../components/Plane';
import { BetPanel } from '../components/BetPanel';
import { AutoBetPanel } from '../components/AutoBetPanel';
import { LiveBets } from '../components/LiveBets';
import { HistoryBar } from '../components/HistoryBar';
import { StatsBar } from '../components/StatsBar';
import { Stars } from '../components/Stars';

type Tab = 'manual' | 'auto' | 'bets';

export function AviatorGame() {
  const { state, actions } = useGameState();
  const [tab, setTab] = useState<Tab>('manual');

  const {
    phase, multiplier, crashPoint, countdown,
    liveBets, history, playerBet, playerCashedOut,
    playerBetAmount, balance, autoCashout, autoBet, autoBetAmount,
    totalWon, totalLost,
  } = state;

  return (
    <div className="min-h-screen w-full flex flex-col max-w-lg mx-auto px-3 py-3 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff5f1f, #dc2626)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <div>
            <div className="font-black text-base leading-tight" style={{ color: '#ff5f1f' }}>AVIATOR</div>
            <div className="text-xs text-muted-foreground leading-tight">Crash Game</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Balance</div>
          <div className="text-base font-black" style={{ color: '#ff5f1f' }}>${balance.toFixed(2)}</div>
        </div>
      </div>

      {/* History Bar */}
      <div className="px-1">
        <HistoryBar history={history} />
      </div>

      {/* Game Canvas */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: '280px',
          background: 'radial-gradient(ellipse at 30% 70%, rgba(255,95,31,0.08) 0%, transparent 60%), linear-gradient(180deg, hsl(220 25% 9%) 0%, hsl(220 20% 7%) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stars />

        {/* Graph */}
        <CrashGraph multiplier={multiplier} phase={phase} crashPoint={crashPoint} />

        {/* Plane */}
        <Plane phase={phase} multiplier={multiplier} />

        {/* Multiplier Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MultiplierDisplay multiplier={multiplier} phase={phase} countdown={countdown} />
        </div>

        {/* Player cashout notification */}
        {playerCashedOut && phase === 'flying' && (
          <div
            className="absolute top-3 right-3 px-3 py-2 rounded-xl text-sm font-bold slide-up"
            style={{ background: 'rgba(34,197,94,0.9)', color: 'white', backdropFilter: 'blur(8px)' }}
          >
            Cashed out @ {playerCashedOut.toFixed(2)}x
          </div>
        )}

        {/* Crashed overlay */}
        {phase === 'crashed' && playerBet && !playerCashedOut && (
          <div
            className="absolute top-3 right-3 px-3 py-2 rounded-xl text-sm font-bold slide-up"
            style={{ background: 'rgba(239,68,68,0.9)', color: 'white', backdropFilter: 'blur(8px)' }}
          >
            Flew away!
          </div>
        )}

        {/* Bet placed indicator */}
        {phase === 'waiting' && playerBet && (
          <div
            className="absolute top-3 left-3 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e' }}
          >
            Bet: ${playerBet}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <StatsBar
        balance={balance}
        totalWon={totalWon}
        totalLost={totalLost}
        onAddBalance={actions.addBalance}
      />

      {/* Tabs */}
      <div
        className="flex rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {(['manual', 'auto', 'bets'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              background: tab === t ? 'rgba(255,95,31,0.2)' : 'transparent',
              color: tab === t ? '#ff5f1f' : undefined,
              border: tab === t ? '1px solid rgba(255,95,31,0.3)' : '1px solid transparent',
            }}
          >
            {t === 'bets' ? `Live Bets (${liveBets.length})` : t === 'auto' ? 'Auto' : 'Manual'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'manual' && (
        <BetPanel
          phase={phase}
          betAmount={playerBetAmount}
          playerBet={playerBet}
          playerCashedOut={playerCashedOut}
          balance={balance}
          autoCashout={autoCashout}
          onPlaceBet={actions.placeBet}
          onCancelBet={actions.cancelBet}
          onCashOut={actions.cashOut}
          onSetBetAmount={actions.setBetAmount}
          onSetAutoCashout={actions.setAutoCashout}
        />
      )}

      {tab === 'auto' && (
        <AutoBetPanel
          autoBet={autoBet}
          autoBetAmount={autoBetAmount}
          autoCashout={autoCashout}
          balance={balance}
          onToggleAutoBet={actions.toggleAutoBet}
          onSetAutoBetAmount={actions.setAutoBetAmount}
          onSetAutoCashout={actions.setAutoCashout}
        />
      )}

      {tab === 'bets' && (
        <div
          className="p-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
            Live Bets this Round
          </div>
          <LiveBets
            bets={liveBets}
            playerBet={playerBet}
            playerCashedOut={playerCashedOut}
          />
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-2">
        Free-to-play demo — no real money involved
      </div>
    </div>
  );
}
