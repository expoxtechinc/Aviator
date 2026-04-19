export type GamePhase = 'waiting' | 'flying' | 'crashed';

export interface BetRecord {
  id: string;
  player: string;
  amount: number;
  cashedOut?: number;
  profit?: number;
  status: 'active' | 'won' | 'lost';
  avatar: string;
  targetCashout: number; // pre-determined, resolves live
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

// More realistic crash distribution with house edge
export function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.02) return 1.0; // 2% instant crash
  // House edge 3% — expected value < 1
  const crash = Math.max(1.01, 0.97 / (1 - r));
  return Math.round(crash * 100) / 100;
}

export function getMultiplierColor(multiplier: number): string {
  if (multiplier < 1.5) return '#ff5f1f';
  if (multiplier < 2.0) return '#f59e0b';
  if (multiplier < 5.0) return '#22c55e';
  if (multiplier < 10.0) return '#06b6d4';
  if (multiplier < 50.0) return '#a855f7';
  return '#fbbf24'; // gold for moon shots
}

export function formatMultiplier(val: number): string {
  if (val >= 1000) return val.toFixed(0) + 'x';
  if (val >= 100) return val.toFixed(1) + 'x';
  return val.toFixed(2) + 'x';
}

export function getMultiplierLabel(val: number): string {
  if (val >= 1000) return '🌕 TO THE MOON';
  if (val >= 100) return '🚀 LEGENDARY';
  if (val >= 50) return '💎 INSANE';
  if (val >= 20) return '⚡ EPIC';
  if (val >= 10) return '🔥 MEGA';
  if (val >= 5) return '✨ BIG WIN';
  if (val >= 2) return 'WIN';
  return '';
}

// Bot personalities — determines cashout behavior
type BotPersonality = 'conservative' | 'normal' | 'risky' | 'whale' | 'degen';

const PERSONALITIES: BotPersonality[] = ['conservative', 'conservative', 'normal', 'normal', 'normal', 'risky', 'whale', 'degen'];

function getBotTargetCashout(personality: BotPersonality, crashPoint: number): number {
  let target: number;
  switch (personality) {
    case 'conservative': target = 1.1 + Math.random() * 0.7; break;  // 1.1–1.8x
    case 'normal':       target = 1.5 + Math.random() * 1.5; break;  // 1.5–3.0x
    case 'risky':        target = 2.5 + Math.random() * 5.5; break;  // 2.5–8.0x
    case 'whale':        target = 2.0 + Math.random() * 8.0; break;  // 2.0–10x, large bets
    case 'degen':        target = crashPoint * (0.85 + Math.random() * 0.2); break; // holds near crash
  }
  return Math.round(target * 100) / 100;
}

function getBotBetAmount(personality: BotPersonality): number {
  const amounts = {
    conservative: [5, 10, 10, 20, 25],
    normal: [10, 20, 25, 50, 100],
    risky: [20, 50, 100, 200],
    whale: [200, 500, 1000, 2000, 5000],
    degen: [50, 100, 200, 500],
  };
  const pool = amounts[personality];
  return pool[Math.floor(Math.random() * pool.length)];
}

const BOT_AVATARS = ['🦅', '🦁', '🐯', '🦊', '🐺', '🦋', '🐲', '🦄', '🦩', '🐬', '🦜', '🐸', '🦝', '🐻', '🦈'];

export const BOT_NAMES = [
  'Falcon777', 'LuckyAce', 'SpeedRunner', 'MoonChaser', 'HighRoller',
  'CrashKing', 'JetSetter', 'StarPilot', 'BetMaster', 'SkyWalker',
  'RocketMan', 'GoldWing', 'AceHigh', 'TurboJet', 'BlazeTail',
  'NovaStar', 'CryptoFlyer', 'IronEagle', 'SwiftHawk', 'PhoenixUp',
  'DiamondHand', 'MoonHunter', 'GalacticBet', 'CosmicRider', 'NebulaKing',
  'StormChaser', 'NightFly', 'DarkHorse', 'RedAlert', 'SilverFox',
];

export function generateBotBets(round: number, crashPoint: number): BetRecord[] {
  const count = 8 + Math.floor(Math.random() * 18); // 8–25 players
  return Array.from({ length: count }, (_, i) => {
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    const target = getBotTargetCashout(personality, crashPoint);
    return {
      id: `bot-${round}-${i}`,
      player: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
      amount: getBotBetAmount(personality),
      status: 'active' as const,
      avatar: BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)],
      targetCashout: target,
    };
  });
}

// Called every tick — resolve bots whose target has been passed
export function progressiveBotResolve(
  bets: BetRecord[],
  currentMultiplier: number,
  crashPoint: number,
  crashed: boolean,
): BetRecord[] {
  return bets.map(bet => {
    if (bet.status !== 'active') return bet;
    if (crashed) {
      if (bet.targetCashout >= crashPoint) {
        return { ...bet, status: 'lost' as const };
      }
    }
    if (currentMultiplier >= bet.targetCashout) {
      const rounded = Math.round(bet.targetCashout * 100) / 100;
      return {
        ...bet,
        cashedOut: rounded,
        profit: Math.round(bet.amount * rounded - bet.amount),
        status: 'won' as const,
      };
    }
    return bet;
  });
}
