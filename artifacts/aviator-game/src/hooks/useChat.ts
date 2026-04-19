import { useState, useEffect, useRef, useCallback } from 'react';
import { BOT_NAMES } from '../lib/gameEngine';

export interface ChatMessage {
  id: string;
  player: string;
  text: string;
  type: 'win' | 'loss' | 'chat' | 'system';
  timestamp: number;
}

const WIN_MESSAGES = [
  'LETS GOOO!! 🚀', 'Cashed out just in time!', 'GG everyone!',
  'That was close 😅', 'Perfect exit!', 'Winner winner!',
  'I always knew it would crash 😂', 'Nice round fellas',
];
const LOSS_MESSAGES = [
  'Nooo I was waiting for 10x 😭', 'Too greedy again...', 'Ugh',
  'Next round for sure', 'Gone too soon!', 'RIP my balance',
];
const CHAT_MESSAGES = [
  'What multiplier do you think this round?', 'Going for 2x and no higher',
  'This game is so addictive', 'Feeling lucky today!',
  'Anyone else doing auto cashout?', 'Come on MOON!',
  'Crazy run last time', 'All in this round boys',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useChat(phase: string, playerCashedOut: number | null, playerBet: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'sys1', player: 'System', text: 'Welcome to Aviator! Place your bets and cash out before the plane flies away!', type: 'system', timestamp: Date.now() - 5000 },
  ]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev.slice(-49),
      { ...msg, id: crypto.randomUUID(), timestamp: Date.now() }
    ]);
  }, []);

  // Bot chat during waiting phase
  useEffect(() => {
    if (phase === 'waiting') {
      const delay = 1000 + Math.random() * 2000;
      timerRef.current = setTimeout(() => {
        addMessage({
          player: randomFrom(BOT_NAMES),
          text: randomFrom(CHAT_MESSAGES),
          type: 'chat',
        });
      }, delay);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, addMessage]);

  // Bot reactions when crashed
  useEffect(() => {
    if (phase === 'crashed') {
      const count = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const isWin = Math.random() > 0.45;
          addMessage({
            player: randomFrom(BOT_NAMES),
            text: randomFrom(isWin ? WIN_MESSAGES : LOSS_MESSAGES),
            type: isWin ? 'win' : 'loss',
          });
        }, i * 400 + 300);
      }
    }
  }, [phase, addMessage]);

  const sendMessage = useCallback((text: string, playerName: string) => {
    if (!text.trim()) return;
    addMessage({ player: playerName, text: text.trim(), type: 'chat' });
  }, [addMessage]);

  return { messages, sendMessage };
}
