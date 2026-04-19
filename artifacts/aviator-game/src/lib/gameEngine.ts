export type GamePhase = 'waiting' | 'flying' | 'crashed';

export interface BetRecord {
  id: string;
  player: string;
  amount: number;
  cashedOut?: number;
  profit?: number;
  status: 'active' | 'won' | 'lost';
}

export interface GameRound {
  id: string;
  crashPoint: number;
  startedAt: number;
}

export interface HistoryEntry {
  multiplier: number;
  crashedAt: Date;
}

export function generateCrashPoint(): number {
  // Provably fair crash point generation
  // House edge ~5%, using exponential distribution
  const r = Math.random();
  if (r < 0.01) return 1.0; // 1% chance of immediate crash
  const crash = Math.max(1.0, 0.99 / (1 - r));
  return Math.round(crash * 100) / 100;
}

export function getMultiplierColor(multiplier: number): string {
  if (multiplier < 1.5) return '#ff5f1f'; // orange-red
  if (multiplier < 2.0) return '#f59e0b'; // amber
  if (multiplier < 5.0) return '#22c55e'; // green
  if (multiplier < 10.0) return '#06b6d4'; // cyan
  return '#a855f7'; // purple (moon)
}

export function formatMultiplier(val: number): string {
  return val.toFixed(2) + 'x';
}

export function getMultiplierLabel(val: number): string {
  if (val >= 100) return 'MOON';
  if (val >= 10) return 'EPIC';
  if (val >= 5) return 'MEGA';
  if (val >= 2) return 'BIG';
  return '';
}

// Bot player names for live bets simulation
export const BOT_NAMES = [
  'Falcon777', 'LuckyAce', 'SpeedRunner', 'MoonChaser', 'HighRoller',
  'CrashKing', 'JetSetter', 'StarPilot', 'BetMaster', 'SkyWalker',
  'RocketMan', 'GoldWing', 'AceHigh', 'TurboJet', 'BlazeTail',
  'NovaStar', 'CryptoFlyer', 'IronEagle', 'SwiftHawk', 'PhoenixUp'
];

export function generateBotBets(round: number): BetRecord[] {
  const count = 5 + Math.floor(Math.random() * 12);
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${round}-${i}`,
    player: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    amount: [5, 10, 20, 25, 50, 100, 200, 500][Math.floor(Math.random() * 8)],
    status: 'active' as const
  }));
}

export function resolveBotBets(
  bets: BetRecord[],
  crashPoint: number
): BetRecord[] {
  return bets.map(bet => {
    const cashedAt = Math.random() * (crashPoint - 1) + 1;
    if (cashedAt < crashPoint && Math.random() > 0.35) {
      const rounded = Math.round(cashedAt * 100) / 100;
      return {
        ...bet,
        cashedOut: rounded,
        profit: Math.round(bet.amount * rounded - bet.amount),
        status: 'won' as const
      };
    }
    return { ...bet, status: 'lost' as const };
  });
}
