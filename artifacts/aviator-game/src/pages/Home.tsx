import { useState } from 'react';
import { Link } from 'wouter';
import { BookingModal } from '../components/BookingModal';
import { CASINO_GAMES } from '../data/games';

const SECTIONS = [
  { href: '/casino', emoji: '🎰', label: 'Casino Games', count: '52+', desc: 'Slots, Roulette, Blackjack, Crash games & Live casino', color: '#ff5f1f', glow: 'rgba(255,95,31,0.1)' },
  { href: '/virtual', emoji: '🎮', label: 'Virtual Games', count: '50+', desc: 'Virtual Football, Horse Racing, F1, Basketball & more', color: '#06b6d4', glow: 'rgba(6,182,212,0.1)' },
  { href: '/sports', emoji: '⚽', label: 'Sports Betting', count: '51+', desc: 'Premier League, Champions League, NBA, UFC & more', color: '#22c55e', glow: 'rgba(34,197,94,0.1)' },
  { href: '/spin', emoji: '🎡', label: 'Spin & Win', count: '∞', desc: 'Spin the wheel for prizes, free plays & bonuses', color: '#a855f7', glow: 'rgba(168,85,247,0.1)' },
  { href: '/scholarships', emoji: '🎓', label: 'Free Scholarships', count: '100+', desc: 'Fully-funded scholarships for Liberian students worldwide', color: '#a855f7', glow: 'rgba(168,85,247,0.1)' },
  { href: '/visas', emoji: '✈️', label: 'Free Visa Countries', count: '100+', desc: 'Countries Liberians can visit visa-free or on arrival', color: '#22c55e', glow: 'rgba(34,197,94,0.1)' },
];

const FEATURED = CASINO_GAMES.slice(0, 4);

export function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'hsl(220 20% 7%)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 py-16 text-center"
        style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255,95,31,0.15) 0%, transparent 70%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10 text-6xl select-none">
          {['✈️', '🎰', '⚽', '🎡', '🎓', '🃏', '🏆', '💎'].map((e, i) => (
            <span key={i} className="absolute" style={{ left: `${5 + i * 12}%`, top: `${20 + (i % 3) * 30}%` }}>{e}</span>
          ))}
        </div>

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4">
          <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(255,95,31,0.15)', color: '#ff5f1f', border: '1px solid rgba(255,95,31,0.3)' }}>
            🇱🇷 Liberia's #1 Platform
          </div>

          <h1 className="font-black text-4xl sm:text-5xl leading-tight">
            Play, Win & <span style={{ color: '#ff5f1f' }}>Go Global</span>
          </h1>

          <p className="text-muted-foreground text-base max-w-lg">
            Games, scholarships and visa info — all free, all in one place. Book any opportunity directly via WhatsApp.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/play"
              className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wide no-underline transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff5f1f, #dc2626)', color: 'white', boxShadow: '0 0 24px rgba(255,95,31,0.5)', display: 'inline-block' }}
            >
              ✈️ Play Aviator Now
            </Link>
            <button
              onClick={() => setBookingOpen(true)}
              className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
            >
              📲 WhatsApp Us
            </button>
          </div>

          <div className="flex gap-6 mt-2">
            {[['52+', 'Casino Games'], ['100+', 'Scholarships'], ['100+', 'Free Visa Countries']].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="font-black text-xl" style={{ color: '#ff5f1f' }}>{n}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-10">
        {/* Section grid */}
        <section>
          <h2 className="font-black text-lg mb-4">Explore Everything</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTIONS.map(s => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center gap-4 p-4 rounded-2xl no-underline transition-all hover:scale-105 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${s.glow} 0%, rgba(255,255,255,0.03) 100%)`, border: `1px solid ${s.color}30`, display: 'flex' }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: `${s.color}20` }}>
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">{s.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-lg font-bold"
                      style={{ background: `${s.color}20`, color: s.color }}>
                      {s.count}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{s.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured games */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg">🔥 Featured Games</h2>
            <Link href="/casino" className="text-xs text-muted-foreground hover:text-foreground no-underline">See all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURED.map(game => (
              <Link
                key={game.id}
                href={game.id === 'aviator' ? '/play' : '/casino'}
                className="no-underline"
                style={{ display: 'block' }}
              >
                <div
                  className="p-3 rounded-2xl flex flex-col gap-2 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="w-full aspect-square rounded-xl flex items-center justify-center text-4xl"
                    style={{ background: game.id === 'aviator' ? 'rgba(255,95,31,0.2)' : 'rgba(255,255,255,0.05)' }}>
                    {game.emoji}
                  </div>
                  <div className="font-bold text-xs truncate">{game.name}</div>
                  <div className="text-xs text-muted-foreground">👥 {game.players}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Scholarship CTA */}
        <section>
          <div className="relative overflow-hidden p-6 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.05) 100%)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div className="absolute right-4 top-4 text-6xl opacity-20">🎓</div>
            <div className="relative z-10">
              <div className="font-black text-lg">100+ Free Scholarships for Liberians 🇱🇷</div>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Study in the UK, USA, Germany, China, Korea, Japan & more — fully funded. Apply right here.
              </p>
              <Link
                href="/scholarships"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm no-underline transition-all hover:scale-105"
                style={{ background: 'rgba(168,85,247,0.8)', color: 'white', display: 'inline-flex' }}
              >
                🎓 View All Scholarships
              </Link>
            </div>
          </div>
        </section>

        {/* Visa CTA */}
        <section>
          <div className="relative overflow-hidden p-6 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="absolute right-4 top-4 text-6xl opacity-20">✈️</div>
            <div className="relative z-10">
              <div className="font-black text-lg">100+ Free Visa Countries for Liberians ✈️</div>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Discover countries you can visit visa-free, on arrival or with an easy eVisa as a Liberian passport holder.
              </p>
              <Link
                href="/visas"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm no-underline transition-all hover:scale-105"
                style={{ background: 'rgba(34,197,94,0.8)', color: 'white', display: 'inline-flex' }}
              >
                ✈️ Explore Free Visas
              </Link>
            </div>
          </div>
        </section>

        {/* WhatsApp CTA */}
        <section className="pb-4">
          <div className="p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4"
            style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
            <div className="text-5xl">📲</div>
            <div className="flex-1 text-center sm:text-left">
              <div className="font-black">Book Everything via WhatsApp</div>
              <div className="text-sm text-muted-foreground">All bookings, applications, and enquiries handled personally by our team.</div>
            </div>
            <a
              href="https://wa.me/231889792996"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-6 py-3 rounded-xl font-black text-sm no-underline transition-all hover:scale-105"
              style={{ background: '#25D366', color: 'white' }}
            >
              Chat Now
            </a>
          </div>
        </section>
      </div>

      {bookingOpen && (
        <BookingModal
          title="Contact ExpoXTech"
          subtitle="We'll reply within 24 hours"
          type="contact"
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
