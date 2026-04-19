import { useState, useEffect, useCallback } from 'react';

export interface LeaderboardEntry {
  id: string;
  name: string;
  biggestMultiplier: number;
  biggestWin: number;
  totalGames: number;
  totalWins: number;
  totalProfit: number;
  lastSeen: number;
}

const STORAGE_KEY = 'aviator_leaderboard';
const PLAYER_KEY = 'aviator_player';

function load(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(entries: LeaderboardEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getOrCreatePlayer(): { id: string; name: string } {
  try {
    const stored = localStorage.getItem(PLAYER_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const adjectives = ['Lucky', 'Fast', 'Turbo', 'Gold', 'Fire', 'Sky', 'Moon', 'Star', 'Iron', 'Ace'];
  const nouns = ['Eagle', 'Hawk', 'Pilot', 'Rider', 'Flash', 'Storm', 'Wing', 'Blaze', 'Jet', 'Ace'];
  const name = adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)] + Math.floor(Math.random() * 100);
  const player = { id: crypto.randomUUID(), name };
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  return player;
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(load);
  const [player] = useState(getOrCreatePlayer);

  useEffect(() => {
    // Seed with some AI players if empty
    if (entries.length < 5) {
      const seedPlayers: LeaderboardEntry[] = [
        { id: 'seed1', name: 'CrashKing99', biggestMultiplier: 42.5, biggestWin: 2100, totalGames: 234, totalWins: 121, totalProfit: 4500, lastSeen: Date.now() - 3600000 },
        { id: 'seed2', name: 'MoonHunter', biggestMultiplier: 88.3, biggestWin: 8830, totalGames: 189, totalWins: 94, totalProfit: 12400, lastSeen: Date.now() - 7200000 },
        { id: 'seed3', name: 'JetPilot77', biggestMultiplier: 15.2, biggestWin: 760, totalGames: 501, totalWins: 290, totalProfit: 3200, lastSeen: Date.now() - 1800000 },
        { id: 'seed4', name: 'SkyRocket', biggestMultiplier: 31.0, biggestWin: 1550, totalGames: 88, totalWins: 40, totalProfit: -200, lastSeen: Date.now() - 600000 },
        { id: 'seed5', name: 'AceHigh99', biggestMultiplier: 7.8, biggestWin: 390, totalGames: 320, totalWins: 195, totalProfit: 8800, lastSeen: Date.now() - 120000 },
      ];
      const merged = [...entries];
      for (const s of seedPlayers) {
        if (!merged.find(e => e.id === s.id)) merged.push(s);
      }
      save(merged);
      setEntries(merged);
    }
  }, []);

  const recordRound = useCallback((params: {
    betAmount: number;
    cashedOut: number | null;
    crashPoint: number;
  }) => {
    const { betAmount, cashedOut, crashPoint } = params;
    const won = !!cashedOut;
    const profit = won ? Math.round((betAmount * cashedOut! - betAmount) * 100) / 100 : -betAmount;

    setEntries(prev => {
      const existing = prev.find(e => e.id === player.id);
      const updated: LeaderboardEntry = existing
        ? {
            ...existing,
            biggestMultiplier: cashedOut ? Math.max(existing.biggestMultiplier, cashedOut) : existing.biggestMultiplier,
            biggestWin: won ? Math.max(existing.biggestWin, Math.round(betAmount * cashedOut!)) : existing.biggestWin,
            totalGames: existing.totalGames + 1,
            totalWins: won ? existing.totalWins + 1 : existing.totalWins,
            totalProfit: Math.round((existing.totalProfit + profit) * 100) / 100,
            lastSeen: Date.now(),
          }
        : {
            id: player.id,
            name: player.name,
            biggestMultiplier: cashedOut ?? 0,
            biggestWin: won ? Math.round(betAmount * cashedOut!) : 0,
            totalGames: 1,
            totalWins: won ? 1 : 0,
            totalProfit: profit,
            lastSeen: Date.now(),
          };

      const next = existing ? prev.map(e => (e.id === player.id ? updated : e)) : [...prev, updated];
      save(next);
      return next;
    });
  }, [player.id]);

  const sorted = [...entries].sort((a, b) => b.biggestMultiplier - a.biggestMultiplier);

  return { entries: sorted, player, recordRound };
}
