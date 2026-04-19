import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GamePhase,
  BetRecord,
  HistoryEntry,
  generateCrashPoint,
  generateBotBets,
  resolveBotBets,
  formatMultiplier
} from '../lib/gameEngine';

const WAITING_DURATION = 5000; // 5s between rounds
const MULTIPLIER_TICK_MS = 100; // update every 100ms

interface GameState {
  phase: GamePhase;
  multiplier: number;
  crashPoint: number;
  countdown: number;
  liveBets: BetRecord[];
  history: HistoryEntry[];
  playerBet: number | null;
  playerCashedOut: number | null;
  playerBetAmount: number;
  balance: number;
  roundId: number;
  autoCashout: number | null;
  autoBet: boolean;
  autoBetAmount: number;
  totalWon: number;
  totalLost: number;
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    phase: 'waiting',
    multiplier: 1.0,
    crashPoint: 2.0,
    countdown: 5,
    liveBets: [],
    history: [],
    playerBet: null,
    playerCashedOut: null,
    playerBetAmount: 10,
    balance: 1000,
    roundId: 0,
    autoCashout: null,
    autoBet: false,
    autoBetAmount: 10,
    totalWon: 0,
    totalLost: 0,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(2.0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startWaiting = useCallback((roundId: number) => {
    const newCrashPoint = generateCrashPoint();
    crashPointRef.current = newCrashPoint;
    const bots = generateBotBets(roundId);

    setState(prev => ({
      ...prev,
      phase: 'waiting',
      multiplier: 1.0,
      crashPoint: newCrashPoint,
      countdown: 5,
      roundId,
      liveBets: bots,
      playerBet: null,
      playerCashedOut: null,
    }));

    let count = 5;
    intervalRef.current = setInterval(() => {
      count -= 1;
      setState(prev => ({ ...prev, countdown: count }));
      if (count <= 0) {
        clearInterval(intervalRef.current!);
        startFlying(roundId, newCrashPoint, bots);
      }
    }, 1000);
  }, []);

  const startFlying = useCallback((roundId: number, crashPoint: number, bots: BetRecord[]) => {
    startTimeRef.current = Date.now();

    setState(prev => ({
      ...prev,
      phase: 'flying',
      multiplier: 1.0,
    }));

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth: multiplier = e^(k*t), where k controls speed
      const newMultiplier = Math.round(Math.pow(Math.E, 0.07 * elapsed) * 100) / 100;

      const st = stateRef.current;

      // Auto cashout check
      if (st.autoCashout && st.playerBet && !st.playerCashedOut && newMultiplier >= st.autoCashout) {
        const cashout = st.autoCashout;
        const winnings = Math.round(st.playerBet * cashout * 100) / 100;
        setState(prev => ({
          ...prev,
          multiplier: newMultiplier,
          playerCashedOut: cashout,
          balance: Math.round((prev.balance + winnings) * 100) / 100,
          totalWon: prev.totalWon + 1,
        }));
        return;
      }

      if (newMultiplier >= crashPoint) {
        clearInterval(intervalRef.current!);
        const resolvedBots = resolveBotBets(bots, crashPoint);

        setState(prev => {
          const lostBet = prev.playerBet && !prev.playerCashedOut;
          return {
            ...prev,
            phase: 'crashed',
            multiplier: crashPoint,
            liveBets: resolvedBots,
            totalLost: lostBet ? prev.totalLost + 1 : prev.totalLost,
          };
        });

        timerRef.current = setTimeout(() => {
          setState(prev => {
            if (prev.autoBet && prev.balance >= prev.autoBetAmount) {
              // auto bet next round
              setTimeout(() => {
                const nextRound = stateRef.current.roundId + 1;
                setState(p => ({ ...p, playerBet: p.autoBetAmount, balance: Math.round((p.balance - p.autoBetAmount) * 100) / 100 }));
                startWaiting(nextRound);
              }, 100);
            }
            return prev;
          });
          startWaiting(roundId + 1);
        }, 2000);

        setState(prev => ({
          ...prev,
          history: [
            { multiplier: crashPoint, crashedAt: new Date() },
            ...prev.history.slice(0, 49)
          ]
        }));
      } else {
        setState(prev => ({ ...prev, multiplier: newMultiplier }));
      }
    }, MULTIPLIER_TICK_MS);
  }, [startWaiting]);

  useEffect(() => {
    startWaiting(1);
    return () => clearTimers();
  }, []);

  const placeBet = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'waiting') return prev;
      if (prev.playerBet) return prev;
      if (prev.playerBetAmount > prev.balance) return prev;
      return {
        ...prev,
        playerBet: prev.playerBetAmount,
        balance: Math.round((prev.balance - prev.playerBetAmount) * 100) / 100,
      };
    });
  }, []);

  const cancelBet = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'waiting' || !prev.playerBet) return prev;
      return {
        ...prev,
        playerBet: null,
        balance: Math.round((prev.balance + prev.playerBetAmount) * 100) / 100,
      };
    });
  }, []);

  const cashOut = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'flying' || !prev.playerBet || prev.playerCashedOut) return prev;
      const winnings = Math.round(prev.playerBet * prev.multiplier * 100) / 100;
      return {
        ...prev,
        playerCashedOut: prev.multiplier,
        balance: Math.round((prev.balance + winnings) * 100) / 100,
        totalWon: prev.totalWon + 1,
      };
    });
  }, []);

  const setBetAmount = useCallback((amount: number) => {
    setState(prev => ({ ...prev, playerBetAmount: Math.max(1, Math.min(amount, prev.balance)) }));
  }, []);

  const setAutoCashout = useCallback((val: number | null) => {
    setState(prev => ({ ...prev, autoCashout: val }));
  }, []);

  const toggleAutoBet = useCallback(() => {
    setState(prev => ({ ...prev, autoBet: !prev.autoBet }));
  }, []);

  const setAutoBetAmount = useCallback((amount: number) => {
    setState(prev => ({ ...prev, autoBetAmount: Math.max(1, amount) }));
  }, []);

  const addBalance = useCallback((amount: number) => {
    setState(prev => ({ ...prev, balance: prev.balance + amount }));
  }, []);

  return {
    state,
    actions: { placeBet, cancelBet, cashOut, setBetAmount, setAutoCashout, toggleAutoBet, setAutoBetAmount, addBalance }
  };
}
