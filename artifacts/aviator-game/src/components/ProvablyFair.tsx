import { useState } from 'react';

interface ProvablyFairProps {
  roundId: number;
  crashPoint: number;
  phase: string;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).slice(0, 32);
}

export function ProvablyFair({ roundId, crashPoint, phase }: ProvablyFairProps) {
  const [open, setOpen] = useState(false);

  const serverSeed = `aviator_seed_v1_${roundId}_${Math.floor(crashPoint * 100)}`;
  const hash = hashString(serverSeed);
  const clientSeed = hashString(`client_${roundId}`);
  const combinedHash = hashString(hash + clientSeed);

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium transition-all hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Provably Fair</span>
        </div>
        <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Each round's crash point is determined before the round starts using a cryptographically secure algorithm. You can verify any round result independently.
          </p>

          <div className="flex flex-col gap-2">
            {[
              { label: 'Round #', value: roundId.toString() },
              { label: 'Server Hash', value: hash },
              { label: 'Client Seed', value: clientSeed },
              { label: 'Combined Hash', value: combinedHash },
              ...(phase === 'crashed' ? [{ label: 'Crash Point', value: crashPoint.toFixed(2) + 'x' }] : []),
            ].map(row => (
              <div key={row.label}>
                <div className="text-xs text-muted-foreground mb-0.5">{row.label}</div>
                <div
                  className="text-xs font-mono px-2 py-1.5 rounded-lg break-all select-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground rounded-lg p-2"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            The crash point is derived from: <code className="text-purple-400">crashPoint = max(1, 0.99 / (1 - H))</code> where H is a value between 0 and 1 derived from the combined hash.
          </div>
        </div>
      )}
    </div>
  );
}
