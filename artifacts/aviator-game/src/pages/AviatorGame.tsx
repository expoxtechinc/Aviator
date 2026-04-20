import { useState, useEffect, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useChat } from '../hooks/useChat';
import { useSound } from '../hooks/useSound';
import { CrashGraph } from '../components/CrashGraph';
import { MultiplierDisplay } from '../components/MultiplierDisplay';
import { Plane } from '../components/Plane';
import { SingleBetSlot } from '../components/SingleBetSlot';
import { AutoBetPanel } from '../components/AutoBetPanel';
import { LiveBets } from '../components/LiveBets';
import { LiveChat } from '../components/LiveChat';
import { Leaderboard } from '../components/Leaderboard';
import { GameStats } from '../components/GameStats';
import { RoundHistory } from '../components/RoundHistory';
import { ProvablyFair } from '../components/ProvablyFair';
import { HistoryBar } from '../components/HistoryBar';
import { Stars } from '../components/Stars';

type Tab = 'bet' | 'auto' | 'bets' | 'chat' | 'board' | 'stats' | 'history' | 'fair';

const TABS: { id: Tab; label: string }[] = [
  { id: 'bet', label: 'Bet' },
  { id: 'auto', label: 'Auto' },
  { id: 'bets', label: 'Bets' },
  { id: 'chat', label: 'Chat' },
  { id: 'board', label: 'Board' },
  { id: 'stats', label: 'Stats' },
  { id: 'history', label: 'History' },
  { id: 'fair', label: 'Fair' },
];

export function AviatorGame() {
  const { state, actions } = useGameState();
  const { entries: leaderboard, player, recordRound } = useLeaderboard();
  const { messages, sendMessage } = useChat(state.phase, state.bet1.cashedOut, state.bet1.active ? state.bet1.amount : null);
  const [tab, setTab] = useState<Tab>('bet');
  const [soundOn, setSoundOn] = useState(false);
  const sound = useSound(soundOn);

  const {
    phase, multiplier, crashPoint, countdown,
    liveBets, history, bet1, bet2, enableBet2,
    balance, roundId, autoCashout1, autoCashout2,
    autoBet, autoBetAmount, autoCashoutAuto,
    totalWon, totalLost, totalProfit, peakMultiplier,
    playerCount, streak,
  } = state;

  // Sound effects wired to game events
  const prevPhaseRef = useRef<typeof phase>('waiting');
  const prevCountdownRef = useRef(7);
  const prevBet1CashedOut = useRef<number | null>(null);
  const prevBet2CashedOut = useRef<number | null>(null);

  useEffect(() => {
    // Phase transitions
    if (prevPhaseRef.current === 'waiting' && phase === 'flying') {
      sound.play('fly_start');
      sound.startEngine();
    }
    if (phase === 'crashed' && prevPhaseRef.current === 'flying') {
      sound.stopEngine();
      sound.play('crash');
    }
    if (phase === 'waiting' && prevPhaseRef.current === 'crashed') {
      // silence
    }
    prevPhaseRef.current = phase;
  }, [phase, sound]);

  useEffect(() => {
    // Update engine pitch with multiplier
    if (phase === 'flying') {
      sound.updateEngine(multiplier);
    }
  }, [multiplier, phase, sound]);

  useEffect(() => {
    // Countdown beeps (last 3 seconds)
    if (phase === 'waiting' && countdown <= 3 && countdown < prevCountdownRef.current) {
      sound.play('countdown');
    }
    prevCountdownRef.current = countdown;
  }, [countdown, phase, sound]);

  useEffect(() => {
    if (bet1.cashedOut && bet1.cashedOut !== prevBet1CashedOut.current) {
      prevBet1CashedOut.current = bet1.cashedOut;
      if (bet1.cashedOut >= 5) sound.play('win_big');
      else sound.play('cashout');
    }
    if (!bet1.cashedOut) prevBet1CashedOut.current = null;
  }, [bet1.cashedOut, sound]);

  useEffect(() => {
    if (bet2.cashedOut && bet2.cashedOut !== prevBet2CashedOut.current) {
      prevBet2CashedOut.current = bet2.cashedOut;
      if (bet2.cashedOut >= 5) sound.play('win_big');
      else sound.play('cashout');
    }
    if (!bet2.cashedOut) prevBet2CashedOut.current = null;
  }, [bet2.cashedOut, sound]);

  // Wrapped actions that also play sounds
  const placeBet1WithSound = () => { sound.play('bet'); actions.placeBet1(); };
  const placeBet2WithSound = () => { sound.play('bet'); actions.placeBet2(); };
  const cashOut1WithSound = () => { actions.cashOut1(); };
  const cashOut2WithSound = () => { actions.cashOut2(); };

  const total = totalWon + totalLost;
  const winRate = total > 0 ? Math.round((totalWon / total) * 100) : 0;

  return (
    <div className="min-h-screen w-full flex flex-col max-w-lg mx-auto px-2 py-2 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #ff5f1f, #dc2626)', boxShadow: '0 0 16px rgba(255,95,31,0.4)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <div>
            <div className="font-black text-lg leading-tight tracking-tight" style={{ color: '#ff5f1f' }}>AVIATOR</div>
            <div className="text-xs text-muted-foreground leading-tight">Crash Game • Demo</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(s => !s)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: soundOn ? 'rgba(255,95,31,0.2)' : 'rgba(255,255,255,0.07)' }}
            title={soundOn ? 'Mute' : 'Unmute'}
          >
            {soundOn ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 9H4.5A1.5 1.5 0 003 10.5v3A1.5 1.5 0 004.5 15H9l3 3V6L9 9z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Balance */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="text-base font-black" style={{ color: '#ff5f1f' }}>${balance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* History bar */}
      <div>
        <HistoryBar history={history} />
      </div>

      {/* Game canvas */}
      <div
        className="relative rounded-2xl overflow-hidden flex-shrink-0"
        style={{
          height: '260px',
          background: 'radial-gradient(ellipse at 30% 70%, rgba(255,95,31,0.08) 0%, transparent 60%), linear-gradient(180deg, hsl(220 25% 9%) 0%, hsl(220 20% 6%) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stars />
        <CrashGraph multiplier={multiplier} phase={phase} crashPoint={crashPoint} />
        <Plane phase={phase} multiplier={multiplier} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MultiplierDisplay multiplier={multiplier} phase={phase} countdown={countdown} />
        </div>

        {/* Cashout notifications */}
        {bet1.cashedOut && phase === 'flying' && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-sm font-bold slide-up"
            style={{ background: 'rgba(34,197,94,0.9)', color: 'white', backdropFilter: 'blur(8px)' }}>
            Cashed @ {bet1.cashedOut.toFixed(2)}x ✓
          </div>
        )}
        {phase === 'crashed' && bet1.active && !bet1.cashedOut && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-sm font-bold slide-up"
            style={{ background: 'rgba(239,68,68,0.9)', color: 'white', backdropFilter: 'blur(8px)' }}>
            Flew away! -${bet1.amount}
          </div>
        )}
        {phase === 'waiting' && (bet1.active || bet2.active) && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e' }}>
            Bet{bet1.active && bet2.active ? 's' : ''} placed ✓
          </div>
        )}

        {/* Peak multiplier badge */}
        {peakMultiplier > 1.5 && phase !== 'waiting' && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#fbbf24', backdropFilter: 'blur(4px)' }}>
            Peak: {peakMultiplier.toFixed(2)}x
          </div>
        )}
      </div>

      {/* Streak indicator */}
      {(streak >= 3 || streak <= -2) && (
        <div
          className="px-3 py-2 rounded-xl text-xs font-bold text-center"
          style={{
            background: streak >= 3
              ? 'rgba(251,191,36,0.12)'
              : 'rgba(34,197,94,0.12)',
            border: `1px solid ${streak >= 3 ? 'rgba(251,191,36,0.3)' : 'rgba(34,197,94,0.3)'}`,
            color: streak >= 3 ? '#fbbf24' : '#22c55e',
          }}
        >
          {streak >= 5
            ? `⚠️ ${streak} crashes under 2x in a row — a big round is overdue!`
            : streak >= 3
              ? `🔥 ${streak} low crashes in a row — tension building...`
              : streak <= -3
                ? `🌕 ${Math.abs(streak)} big multipliers in a row — ride the streak!`
                : `✨ ${Math.abs(streak)} high rounds in a row — hot streak!`}
        </div>
      )}

      {/* Stats strip */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Player count */}
          {playerCount > 0 && (
            <div className="flex-shrink-0">
              <div className="text-xs text-muted-foreground leading-none">Players</div>
              <div className="text-sm font-black leading-tight text-foreground">{playerCount}</div>
            </div>
          )}
          {[
            { label: 'W', value: String(totalWon), color: '#22c55e' },
            { label: 'L', value: String(totalLost), color: '#ef4444' },
            ...(total > 0 ? [{ label: 'Win%', value: `${winRate}%`, color: 'rgba(255,255,255,0.6)' }] : []),
            ...(totalProfit !== 0 ? [{ label: 'P/L', value: `${totalProfit >= 0 ? '+' : ''}$${Math.abs(totalProfit).toFixed(0)}`, color: totalProfit >= 0 ? '#22c55e' : '#ef4444' }] : []),
          ].map((s, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="text-xs text-muted-foreground leading-none">{s.label}</div>
              <div className="text-sm font-black leading-tight" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => actions.addBalance(1000)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95"
          style={{ background: 'rgba(255,95,31,0.2)', border: '1px solid rgba(255,95,31,0.4)', color: '#ff5f1f' }}
        >
          +$1000
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex overflow-x-auto gap-0.5 rounded-xl p-1 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
            style={{
              background: tab === t.id ? 'rgba(255,95,31,0.2)' : 'transparent',
              color: tab === t.id ? '#ff5f1f' : 'rgba(255,255,255,0.5)',
              border: tab === t.id ? '1px solid rgba(255,95,31,0.35)' : '1px solid transparent',
            }}
          >
            {t.id === 'bets' ? `Bets (${liveBets.length})` : t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'bet' && (
        <div className="flex flex-col gap-2">
          {/* Double bet toggle */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">Double Bet (two simultaneous bets)</span>
            <button
              onClick={actions.toggleBet2}
              className="relative w-10 h-5 rounded-full transition-all"
              style={{ background: enableBet2 ? '#ff5f1f' : 'rgba(255,255,255,0.1)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: enableBet2 ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          <div className={`grid gap-2 ${enableBet2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <SingleBetSlot
              slotLabel={enableBet2 ? 'Bet 1' : 'Manual Bet'}
              phase={phase}
              betAmount={bet1.amount}
              isActive={bet1.active}
              cashedOut={bet1.cashedOut}
              balance={balance}
              autoCashout={autoCashout1}
              color="#ff5f1f"
              onPlaceBet={placeBet1WithSound}
              onCancelBet={actions.cancelBet1}
              onCashOut={cashOut1WithSound}
              onSetBetAmount={actions.setBet1Amount}
              onSetAutoCashout={actions.setAutoCashout1}
            />
            {enableBet2 && (
              <SingleBetSlot
                slotLabel="Bet 2"
                phase={phase}
                betAmount={bet2.amount}
                isActive={bet2.active}
                cashedOut={bet2.cashedOut}
                balance={balance}
                autoCashout={autoCashout2}
                color="#06b6d4"
                onPlaceBet={placeBet2WithSound}
                onCancelBet={actions.cancelBet2}
                onCashOut={cashOut2WithSound}
                onSetBetAmount={actions.setBet2Amount}
                onSetAutoCashout={actions.setAutoCashout2}
              />
            )}
          </div>
        </div>
      )}

      {tab === 'auto' && (
        <AutoBetPanel
          autoBet={autoBet}
          autoBetAmount={autoBetAmount}
          autoCashout={autoCashoutAuto}
          balance={balance}
          onToggleAutoBet={actions.toggleAutoBet}
          onSetAutoBetAmount={actions.setAutoBetAmount}
          onSetAutoCashout={actions.setAutoCashoutAuto}
        />
      )}

      {tab === 'bets' && (
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
            Live Bets — Round #{roundId}
          </div>
          <LiveBets
            bets={liveBets}
            playerBet={bet1.active ? bet1.amount : null}
            playerCashedOut={bet1.cashedOut}
          />
        </div>
      )}

      {tab === 'chat' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-3 pt-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Live Chat ({messages.length})
          </div>
          <LiveChat messages={messages} playerName={player.name} onSend={sendMessage} />
        </div>
      )}

      {tab === 'board' && (
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
            Leaderboard — Top Multipliers
          </div>
          <Leaderboard entries={leaderboard} playerId={player.id} />
          <p className="text-xs text-muted-foreground text-center mt-3">
            Playing as <span className="text-foreground font-semibold">{player.name}</span>
          </p>
        </div>
      )}

      {tab === 'stats' && (
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
            Game Statistics — Last {Math.min(history.length, 50)} rounds
          </div>
          <GameStats history={history} />
        </div>
      )}

      {tab === 'history' && (
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
            Round History
          </div>
          <RoundHistory history={history} />
        </div>
      )}

      {tab === 'fair' && (
        <div className="p-3 rounded-2xl flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Provably Fair System
          </div>
          <ProvablyFair roundId={roundId} crashPoint={crashPoint} phase={phase} />
          <div className="rounded-xl p-3 text-xs"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div className="font-semibold text-purple-400 mb-1">How it works</div>
            <ul className="text-muted-foreground space-y-1">
              <li>• Each round's crash point is generated before betting starts</li>
              <li>• The server seed is hashed and combined with a client seed</li>
              <li>• You can verify any result independently after the round</li>
              <li>• No round can be manipulated after bets are placed</li>
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-3 pb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-muted-foreground">Free-to-play demo — no real money</span>
      </div>
    </div>
  );
}
