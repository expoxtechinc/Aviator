import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../hooks/useChat';

interface LiveChatProps {
  messages: ChatMessage[];
  playerName: string;
  onSend: (text: string, name: string) => void;
}

function msgColor(type: ChatMessage['type']): string {
  if (type === 'win') return '#22c55e';
  if (type === 'loss') return '#ef4444';
  if (type === 'system') return '#a855f7';
  return 'inherit';
}

export function LiveChat({ messages, playerName, onSend }: LiveChatProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  function handleSend() {
    if (!input.trim()) return;
    onSend(input, playerName);
    setInput('');
    setAutoScroll(true);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col gap-1.5 p-3"
        style={{ maxHeight: '200px' }}
      >
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-1.5 text-xs">
            {msg.type === 'system' ? (
              <span className="text-purple-400 font-semibold w-full text-center py-0.5 rounded"
                style={{ background: 'rgba(168,85,247,0.1)' }}>
                {msg.text}
              </span>
            ) : (
              <>
                <span className="font-bold flex-shrink-0" style={{ color: msgColor(msg.type) }}>
                  {msg.player}:
                </span>
                <span className="text-foreground/80 break-words">{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!autoScroll && (
        <button
          onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          className="mx-3 mb-1 py-1 text-xs rounded text-center"
          style={{ background: 'rgba(255,95,31,0.2)', color: '#ff5f1f' }}
        >
          New messages ↓
        </button>
      )}

      {/* Input */}
      <div className="flex gap-2 px-3 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Say something..."
          maxLength={120}
          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-background border border-border outline-none focus:border-primary"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
          style={{ background: 'rgba(255,95,31,0.3)', color: '#ff5f1f', border: '1px solid rgba(255,95,31,0.4)' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
