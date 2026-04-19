import { useRef, useEffect } from 'react';
import { GamePhase } from '../lib/gameEngine';

interface PlaneProps {
  phase: GamePhase;
  multiplier: number;
}

export function Plane({ phase, multiplier }: PlaneProps) {
  const trailRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  // Animate the contrail canvas
  useEffect(() => {
    const canvas = trailRef.current;
    if (!canvas || phase !== 'flying') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const W = canvas.width;
    const H = canvas.height;

    interface Puff { x: number; y: number; r: number; life: number; }
    const puffs: Puff[] = [];

    function draw() {
      if (!running) return;
      frameRef.current++;
      ctx!.clearRect(0, 0, W, H);

      // Add new puff every 3 frames
      if (frameRef.current % 3 === 0) {
        puffs.push({ x: W - 4, y: H / 2 + (Math.random() - 0.5) * 4, r: 4 + Math.random() * 3, life: 1 });
      }

      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.x -= 2.5;
        p.r += 0.4;
        p.life -= 0.04;
        if (p.life <= 0 || p.x < -p.r) { puffs.splice(i, 1); continue; }
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,180,80,${p.life * 0.7})`);
        g.addColorStop(0.4, `rgba(255,100,30,${p.life * 0.4})`);
        g.addColorStop(1, 'rgba(255,80,0,0)');
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [phase]);

  if (phase === 'waiting') return null;

  // Position plane along the curve path
  const t = Math.log(Math.max(multiplier, 1.001)) / 0.06;
  const normT = Math.min(t / 30, 1); // 0→1 over ~30 seconds
  // Mirror the graph: left=low, right=high; bottom=1x, top=high
  const leftPct = 10 + normT * 55;
  const bottomPct = 12 + Math.pow(normT, 0.7) * 62;

  const isCrashed = phase === 'crashed';
  const shake = multiplier > 10 ? 'plane-shake-hard' : multiplier > 5 ? 'plane-shake' : '';

  return (
    <div
      className={`absolute pointer-events-none z-10 ${shake}`}
      style={{
        bottom: `${Math.min(bottomPct, 78)}%`,
        left: `${Math.min(leftPct, 70)}%`,
        transform: isCrashed
          ? 'rotate(35deg) scale(0.6) translateY(20px)'
          : `rotate(-${4 + Math.min(normT * 10, 18)}deg)`,
        transition: isCrashed
          ? 'transform 0.6s ease-in, bottom 0.6s ease-in, left 0.4s ease-in, opacity 0.8s ease'
          : 'bottom 0.08s linear, left 0.08s linear',
        opacity: isCrashed ? 0.4 : 1,
        filter: isCrashed ? 'drop-shadow(0 0 12px #ef4444)' : multiplier > 10
          ? 'drop-shadow(0 0 16px #a855f7)'
          : multiplier > 5
            ? 'drop-shadow(0 0 12px #22c55e)'
            : 'drop-shadow(0 0 8px rgba(255,95,31,0.8))',
      }}
    >
      {/* Contrail canvas */}
      {!isCrashed && (
        <canvas
          ref={trailRef}
          width={80}
          height={20}
          style={{
            position: 'absolute',
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginRight: '-6px',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Plane SVG */}
      <svg width="88" height="52" viewBox="0 0 88 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shadow / glow base */}
        <ellipse cx="44" cy="30" rx="36" ry="6" fill={isCrashed ? 'rgba(239,68,68,0.2)' : 'rgba(255,95,31,0.15)'} />

        {/* Main fuselage */}
        <path
          d="M10 28 Q22 22 54 24 Q72 23 82 21 Q76 27 54 30 Q22 34 10 28Z"
          fill={isCrashed ? '#ff6b6b' : '#f8fafc'}
          opacity={0.97}
        />
        {/* Fuselage underside shading */}
        <path
          d="M14 28 Q26 30 54 30 Q68 30 76 28 Q72 32 54 33 Q26 35 14 30Z"
          fill="rgba(0,0,0,0.12)"
        />

        {/* Cockpit */}
        <path
          d="M54 24 Q66 19 80 17 Q82 21 74 23 Q64 25 54 24Z"
          fill={isCrashed ? '#fca5a5' : '#7dd3fc'}
          opacity={0.92}
        />
        {/* Cockpit glare */}
        <path
          d="M60 22 Q65 19 72 18 Q74 20 68 22Z"
          fill="rgba(255,255,255,0.6)"
          opacity={0.8}
        />

        {/* Main wing top */}
        <path
          d="M34 25 Q42 14 54 9 Q57 11 52 21 L40 25Z"
          fill={isCrashed ? '#ef4444' : '#ff5f1f'}
        />
        {/* Wing shading */}
        <path
          d="M36 25 Q43 17 52 13 Q54 15 50 21 L40 25Z"
          fill="rgba(255,255,255,0.15)"
        />

        {/* Main wing bottom */}
        <path
          d="M34 29 Q42 40 54 45 Q57 43 52 33 L40 29Z"
          fill={isCrashed ? '#ef4444' : '#ff5f1f'}
          opacity={0.75}
        />

        {/* Tail fin */}
        <path
          d="M10 28 Q15 20 19 15 Q21 17 19 25Z"
          fill={isCrashed ? '#ef4444' : '#ff5f1f'}
        />
        {/* Tail horizontal stabilizer */}
        <path
          d="M14 28 Q20 24 24 22 Q25 24 22 27Z"
          fill={isCrashed ? '#ef4444' : '#ff5f1f'}
          opacity={0.8}
        />

        {/* Windows */}
        <ellipse cx="62" cy="23" rx="3" ry="2.2" fill="#bfdbfe" opacity={0.9} />
        <ellipse cx="70" cy="22" rx="2.5" ry="1.8" fill="#bfdbfe" opacity={0.75} />
        <ellipse cx="77" cy="21" rx="1.8" ry="1.4" fill="#bfdbfe" opacity={0.6} />

        {/* Engine exhaust glow */}
        {!isCrashed && (
          <>
            <ellipse cx="11" cy="28" rx="4" ry="2.2" fill="#ff7a2f" opacity="0.9" />
            <ellipse cx="7" cy="28" rx="5" ry="1.8" fill="#fbbf24" opacity="0.7" />
            <ellipse cx="3" cy="28" rx="5" ry="1.2" fill="#fde68a" opacity="0.4" />
          </>
        )}

        {/* Crash fire */}
        {isCrashed && (
          <>
            <ellipse cx="11" cy="28" rx="6" ry="3" fill="#ef4444" opacity="0.9" />
            <ellipse cx="6" cy="28" rx="7" ry="2.5" fill="#fbbf24" opacity="0.7" />
          </>
        )}
      </svg>
    </div>
  );
}
