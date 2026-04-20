import { useState, useRef } from 'react';
import { BookingModal } from '../components/BookingModal';

const PRIZES = [
  { label: '🎟️ Free Bet', color: '#ff5f1f', value: 'Free Bet Token' },
  { label: '💰 $10 Bonus', color: '#fbbf24', value: '$10 Bonus Credit' },
  { label: '🎓 Scholarship Info', color: '#a855f7', value: 'Scholarship Info Pack' },
  { label: '✈️ Visa Guide', color: '#22c55e', value: 'Free Visa Country Guide' },
  { label: '🏆 $50 Jackpot', color: '#ef4444', value: '$50 Jackpot Prize' },
  { label: '🔁 Try Again', color: '#6b7280', value: 'Try Again' },
  { label: '🎁 Mystery', color: '#06b6d4', value: 'Mystery Gift' },
  { label: '💎 $25 Cash', color: '#8b5cf6', value: '$25 Cash Prize' },
];

const TOTAL = PRIZES.length;
const SEG_ANGLE = 360 / TOTAL;

export function SpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<typeof PRIZES[0] | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [booking, setBooking] = useState(false);
  const ref = useRef(0);

  const spin = () => {
    if (spinning || spinsLeft === 0) return;
    setSpinning(true);
    setPrize(null);

    const extra = 1800 + Math.random() * 1440; // 5-9 full rotations
    const totalRot = rotation + extra;
    ref.current = totalRot;
    setRotation(totalRot);

    setTimeout(() => {
      setSpinning(false);
      setSpinsLeft(s => s - 1);

      // Determine prize from final angle
      const finalAngle = totalRot % 360;
      const idx = Math.floor((360 - finalAngle) / SEG_ANGLE) % TOTAL;
      setPrize(PRIZES[idx]);
    }, 4000);
  };

  const claim = () => {
    if (prize?.value !== 'Try Again') {
      setBooking(true);
    } else {
      setPrize(null);
      setSpinsLeft(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen pb-24 flex flex-col items-center" style={{ background: 'hsl(220 20% 7%)' }}>
      {/* Header */}
      <div
        className="w-full px-4 py-10 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168,85,247,0.15) 0%, transparent 70%)' }}
      >
        <div className="text-4xl mb-2">🎡</div>
        <h1 className="font-black text-3xl">Spin & Win</h1>
        <p className="text-muted-foreground text-sm mt-1">Free spins — win bonuses, scholarship packs & visa guides</p>
        <div
          className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
        >
          🎟️ {spinsLeft} spins remaining
        </div>
      </div>

      <div className="max-w-md w-full px-4 flex flex-col items-center gap-6 mt-4">
        {/* Wheel */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80">
          {/* Pointer */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-3xl"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,95,31,0.8))' }}
          >
            ▼
          </div>

          {/* Wheel SVG */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            style={{
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '50% 50%',
              filter: spinning ? 'drop-shadow(0 0 24px rgba(168,85,247,0.6))' : 'drop-shadow(0 0 8px rgba(168,85,247,0.3))',
            }}
          >
            {PRIZES.map((p, i) => {
              const startAngle = i * SEG_ANGLE;
              const endAngle = startAngle + SEG_ANGLE;
              const toRad = (a: number) => (a * Math.PI) / 180;
              const x1 = 100 + 100 * Math.cos(toRad(startAngle));
              const y1 = 100 + 100 * Math.sin(toRad(startAngle));
              const x2 = 100 + 100 * Math.cos(toRad(endAngle));
              const y2 = 100 + 100 * Math.sin(toRad(endAngle));
              const mx = 100 + 65 * Math.cos(toRad(startAngle + SEG_ANGLE / 2));
              const my = 100 + 65 * Math.sin(toRad(startAngle + SEG_ANGLE / 2));

              return (
                <g key={i}>
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                    fill={p.color}
                    opacity={0.85}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={mx}
                    y={my}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fill="white"
                    fontWeight="bold"
                    transform={`rotate(${startAngle + SEG_ANGLE / 2}, ${mx}, ${my})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="100" cy="100" r="12" fill="hsl(220 20% 12%)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#ff5f1f">⬤</text>
          </svg>
        </div>

        {/* Spin button */}
        <button
          onClick={spin}
          disabled={spinning || spinsLeft === 0}
          className="w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          style={{
            background: spinning || spinsLeft === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
            color: 'white',
            boxShadow: spinning ? 'none' : '0 0 32px rgba(168,85,247,0.5)',
          }}
        >
          {spinning ? '🌀 Spinning...' : spinsLeft === 0 ? '❌ No Spins Left' : '🎡 SPIN!'}
        </button>

        {/* Prize result */}
        {prize && !spinning && (
          <div
            className="w-full p-5 rounded-2xl text-center flex flex-col items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${prize.color}20, ${prize.color}08)`,
              border: `1px solid ${prize.color}50`,
            }}
          >
            <div className="text-4xl">{prize.label.split(' ')[0]}</div>
            <div className="font-black text-lg">You won: {prize.value}!</div>
            <p className="text-sm text-muted-foreground">
              {prize.value === 'Try Again'
                ? 'Better luck next time! Spin again.'
                : 'Claim your prize via WhatsApp — our team will verify and send it within 1 hour.'}
            </p>
            <button
              onClick={claim}
              className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all hover:scale-105"
              style={{
                background: prize.value === 'Try Again' ? 'rgba(255,255,255,0.08)' : '#25D366',
                color: 'white',
              }}
            >
              {prize.value === 'Try Again' ? '🔁 Try Again' : '📲 Claim via WhatsApp'}
            </button>
          </div>
        )}

        {/* Prizes list */}
        <div className="w-full mt-2">
          <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Possible Prizes</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRIZES.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: `${p.color}10`, border: `1px solid ${p.color}25` }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <span className="text-xs font-semibold">{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Get more spins */}
        <div
          className="w-full p-4 rounded-2xl text-center"
          style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}
        >
          <div className="font-bold text-sm mb-1">Want more free spins?</div>
          <p className="text-xs text-muted-foreground mb-3">Share with friends or message us to get bonus spins.</p>
          <a
            href="https://wa.me/231889792996?text=Hi, I want more free spins on ExpoXTech!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm no-underline"
            style={{ background: '#25D366', color: 'white' }}
          >
            📲 Get More Spins
          </a>
        </div>
      </div>

      {booking && prize && (
        <BookingModal
          title={`Claim: ${prize.value}`}
          subtitle="Fill in your details to claim your prize"
          type="contact"
          onClose={() => setBooking(false)}
        />
      )}
    </div>
  );
}
