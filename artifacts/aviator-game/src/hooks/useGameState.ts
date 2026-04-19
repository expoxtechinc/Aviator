import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GamePhase,
  BetRecord,
  generateCrashPoint,
  generateBotBets,
  progressiveBotResolve,
  HistoryEntry,
} from '../lib/gameEngine';

const WAITING_DURATION_MS = 7000;
const MULTIPLIER_TICK_MS = 60;

export interface ExtendedHistoryEntry extends HistoryEntry {
  betAmount?: number;
  cashedOut?: number;
  profit?: number;
}

interface BetSlot {
  amount: number;
  active: boolean;
  cashedOut: number | null;
}

interface GameState {
  phase: GamePhase;
  multiplier: number;
  crashPoint: number;
  countdown: number;
  liveBets: BetRecord[];
  history: ExtendedHistoryEntry[];
  bet1: BetSlot;
  bet2: BetSlot;
  enableBet2: boolean;
  balance: number;
  roundId: number;
  autoCashout1: number | null;
  autoCashout2: number | null;
  autoBet: boolean;
  autoBetAmount: number;
  autoCashoutAuto: number | null;
  totalWon: number;
  totalLost: number;
  totalProfit: number;
  peakMultiplier: number;
  playerCount: number;
  streak: number; // consecutive rounds below 2x (positive) or above 5x (negative)
}

const DEFAULT_BET: BetSlot = { amount: 10, active: false, cashedOut: null };

export function useGameState() {
  const [state, setState] = useState<GameState>({
    phase: 'waiting',
    multiplier: 1.0,
    crashPoint: 2.0,
    countdown: 7,
    liveBets: [],
    history: [],
    bet1: { ...DEFAULT_BET },
    bet2: { ...DEFAULT_BET },
    enableBet2: false,
    balance: 1000,
    roundId: 0,
    autoCashout1: null,
    autoCashout2: null,
    autoBet: false,
    autoBetAmount: 10,
    autoCashoutAuto: null,
    totalWon: 0,
    totalLost: 0,
    totalProfit: 0,
    peakMultiplier: 1.0,
    playerCount: 0,
    streak: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(2.0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const startWaiting = useCallback((roundId: number) => {
    clearTimers();
    const newCrash = generateCrashPoint();
    crashPointRef.current = newCrash;
    const bots = generateBotBets(roundId, newCrash);
    const playerCount = bots.length + Math.floor(Math.random() * 40) + 20;

    setState(prev => ({
      ...prev,
      phase: 'waiting',
      multiplier: 1.0,
      crashPoint: newCrash,
      countdown: 7,
      roundId,
      liveBets: bots,
      playerCount,
      bet1: { ...prev.bet1, active: false, cashedOut: null },
      bet2: { ...prev.bet2, active: false, cashedOut: null },
      peakMultiplier: 1.0,
    }));

    // Auto-bet placement
    timerRef.current = setTimeout(() => {
      const st = stateRef.current;
      if (st.autoBet && !st.bet1.active && st.autoBetAmount <= st.balance) {
        setState(prev => ({
          ...prev,
          bet1: { amount: prev.autoBetAmount, active: true, cashedOut: null },
          autoCashout1: prev.autoCashoutAuto,
          balance: Math.round((prev.balance - prev.autoBetAmount) * 100) / 100,
        }));
      }
    }, 100);

    let count = 7;
    intervalRef.current = setInterval(() => {
      count -= 1;
      setState(prev => ({ ...prev, countdown: count }));
      if (count <= 0) {
        clearInterval(intervalRef.current!);
        // startFlying is called via ref to avoid stale closure
        startFlyingRef.current(roundId, newCrash, bots);
      }
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimers]);

  // Store startFlying in ref to avoid circular deps
  const startFlyingRef = useRef<(roundId: number, crashPoint: number, bots: BetRecord[]) => void>(() => {});

  const startFlying = useCallback((roundId: number, crashPoint: number, bots: BetRecord[]) => {
    startTimeRef.current = Date.now();
    setState(prev => ({ ...prev, phase: 'flying', multiplier: 1.0 }));

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth: e^(0.06 * t), slower at start feels more tense
      const newMult = Math.round(Math.pow(Math.E, 0.06 * elapsed) * 100) / 100;
      const st = stateRef.current;

      // Auto cashout slot 1
      if (st.autoCashout1 && st.bet1.active && !st.bet1.cashedOut && newMult >= st.autoCashout1) {
        const co = st.autoCashout1;
        const winnings = Math.round(st.bet1.amount * co * 100) / 100;
        setState(prev => ({
          ...prev,
          bet1: { ...prev.bet1, cashedOut: co },
          balance: Math.round((prev.balance + winnings) * 100) / 100,
          totalWon: prev.totalWon + 1,
          totalProfit: Math.round((prev.totalProfit + winnings - prev.bet1.amount) * 100) / 100,
        }));
      }
      // Auto cashout slot 2
      if (st.autoCashout2 && st.bet2.active && !st.bet2.cashedOut && newMult >= st.autoCashout2) {
        const co = st.autoCashout2;
        const winnings = Math.round(st.bet2.amount * co * 100) / 100;
        setState(prev => ({
          ...prev,
          bet2: { ...prev.bet2, cashedOut: co },
          balance: Math.round((prev.balance + winnings) * 100) / 100,
          totalWon: prev.totalWon + 1,
          totalProfit: Math.round((prev.totalProfit + winnings - prev.bet2.amount) * 100) / 100,
        }));
      }

      // Progressive bot cashouts — bots cash out live as multiplier hits their target
      const updatedBots = progressiveBotResolve(st.liveBets, newMult, crashPoint, false);
      const botsChanged = updatedBots.some((b, i) => b.status !== st.liveBets[i]?.status);

      if (newMult >= crashPoint) {
        clearInterval(intervalRef.current!);
        const finalBots = progressiveBotResolve(updatedBots, newMult, crashPoint, true);

        setState(prev => {
          const b1Lost = prev.bet1.active && !prev.bet1.cashedOut;
          const b2Lost = prev.bet2.active && !prev.bet2.cashedOut;
          const lossAmt = (b1Lost ? prev.bet1.amount : 0) + (b2Lost ? prev.bet2.amount : 0);
          const losses = (b1Lost ? 1 : 0) + (b2Lost ? 1 : 0);
          const histEntry: ExtendedHistoryEntry = {
            multiplier: crashPoint,
            crashedAt: new Date(),
            betAmount: prev.bet1.active ? prev.bet1.amount : undefined,
            cashedOut: prev.bet1.cashedOut ?? undefined,
            profit: prev.bet1.cashedOut
              ? Math.round((prev.bet1.amount * prev.bet1.cashedOut - prev.bet1.amount) * 100) / 100
              : prev.bet1.active ? -prev.bet1.amount : undefined,
          };
          const newStreak = crashPoint < 2.0
            ? (prev.streak >= 0 ? prev.streak + 1 : 1)
            : crashPoint > 5.0
              ? (prev.streak <= 0 ? prev.streak - 1 : -1)
              : 0;

          return {
            ...prev,
            phase: 'crashed',
            multiplier: crashPoint,
            liveBets: finalBots,
            totalLost: prev.totalLost + losses,
            totalProfit: Math.round((prev.totalProfit - lossAmt) * 100) / 100,
            history: [histEntry, ...prev.history.slice(0, 99)],
            streak: newStreak,
          };
        });

        timerRef.current = setTimeout(() => {
          startWaiting(roundId + 1);
        }, 4000);
      } else {
        setState(prev => ({
          ...prev,
          multiplier: newMult,
          peakMultiplier: Math.max(prev.peakMultiplier, newMult),
          liveBets: botsChanged ? updatedBots : prev.liveBets,
        }));
      }
    }, MULTIPLIER_TICK_MS);
  }, [startWaiting]);

  // Keep startFlyingRef in sync
  useEffect(() => {
    startFlyingRef.current = startFlying;
  }, [startFlying]);

  useEffect(() => {
    startWaiting(1);
    return () => clearTimers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Actions ---
  const placeBet1 = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'waiting' || prev.bet1.active || prev.bet1.amount > prev.balance) return prev;
      return {
        ...prev,
        bet1: { ...prev.bet1, active: true, cashedOut: null },
        balance: Math.round((prev.balance - prev.bet1.amount) * 100) / 100,
      };
    });
  }, []);

  const cancelBet1 = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'waiting' || !prev.bet1.active) return prev;
      return {
        ...prev,
        bet1: { ...prev.bet1, active: false },
        balance: Math.round((prev.balance + prev.bet1.amount) * 100) / 100,
      };
    });
  }, []);

  const cashOut1 = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'flying' || !prev.bet1.active || prev.bet1.cashedOut) return prev;
      const winnings = Math.round(prev.bet1.amount * prev.multiplier * 100) / 100;
      return {
        ...prev,
        bet1: { ...prev.bet1, cashedOut: prev.multiplier },
        balance: Math.round((prev.balance + winnings) * 100) / 100,
        totalWon: prev.totalWon + 1,
        totalProfit: Math.round((prev.totalProfit + winnings - prev.bet1.amount) * 100) / 100,
      };
    });
  }, []);

  const placeBet2 = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'waiting' || prev.bet2.active || prev.bet2.amount > prev.balance) return prev;
      return {
        ...prev,
        bet2: { ...prev.bet2, active: true, cashedOut: null },
        balance: Math.round((prev.balance - prev.bet2.amount) * 100) / 100,
      };
    });
  }, []);

  const cancelBet2 = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'waiting' || !prev.bet2.active) return prev;
      return {
        ...prev,
        bet2: { ...prev.bet2, active: false },
        balance: Math.round((prev.balance + prev.bet2.amount) * 100) / 100,
      };
    });
  }, []);

  const cashOut2 = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'flying' || !prev.bet2.active || prev.bet2.cashedOut) return prev;
      const winnings = Math.round(prev.bet2.amount * prev.multiplier * 100) / 100;
      return {
        ...prev,
        bet2: { ...prev.bet2, cashedOut: prev.multiplier },
        balance: Math.round((prev.balance + winnings) * 100) / 100,
        totalWon: prev.totalWon + 1,
        totalProfit: Math.round((prev.totalProfit + winnings - prev.bet2.amount) * 100) / 100,
      };
    });
  }, []);

  const setBet1Amount = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      bet1: { ...prev.bet1, amount: Math.max(1, Math.min(amount, prev.balance + (prev.bet1.active ? prev.bet1.amount : 0))) },
    }));
  }, []);

  const setBet2Amount = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      bet2: { ...prev.bet2, amount: Math.max(1, Math.min(amount, prev.balance + (prev.bet2.active ? prev.bet2.amount : 0))) },
    }));
  }, []);

  const toggleBet2 = useCallback(() => setState(prev => ({ ...prev, enableBet2: !prev.enableBet2 })), []);
  const setAutoCashout1 = useCallback((val: number | null) => setState(prev => ({ ...prev, autoCashout1: val })), []);
  const setAutoCashout2 = useCallback((val: number | null) => setState(prev => ({ ...prev, autoCashout2: val })), []);
  const toggleAutoBet = useCallback(() => setState(prev => ({ ...prev, autoBet: !prev.autoBet })), []);
  const setAutoBetAmount = useCallback((amount: number) => setState(prev => ({ ...prev, autoBetAmount: Math.max(1, amount) })), []);
  const setAutoCashoutAuto = useCallback((val: number | null) => setState(prev => ({ ...prev, autoCashoutAuto: val })), []);
  const addBalance = useCallback((amount: number) => setState(prev => ({ ...prev, balance: Math.round((prev.balance + amount) * 100) / 100 })), []);

  return {
    state,
    actions: {
      placeBet1, cancelBet1, cashOut1, setBet1Amount,
      placeBet2, cancelBet2, cashOut2, setBet2Amount,
      toggleBet2,
      setAutoCashout1, setAutoCashout2,
      toggleAutoBet, setAutoBetAmount, setAutoCashoutAuto,
      addBalance,
    },
  };
}
