import { useState } from 'react';
import { Link, useLocation } from 'wouter';

const LINKS = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/casino', label: 'Casino', emoji: '🎰' },
  { href: '/virtual', label: 'Virtual', emoji: '🎮' },
  { href: '/sports', label: 'Sports', emoji: '⚽' },
  { href: '/spin', label: 'Spin & Win', emoji: '🎡' },
  { href: '/scholarships', label: 'Scholarships', emoji: '🎓' },
  { href: '/visas', label: 'Free Visas', emoji: '✈️' },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(10,14,22,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 no-underline">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
                style={{ background: 'linear-gradient(135deg, #ff5f1f, #dc2626)', boxShadow: '0 0 16px rgba(255,95,31,0.4)' }}
              >
                ✈
              </div>
              <div>
                <div className="font-black text-sm leading-none" style={{ color: '#ff5f1f' }}>ExpoXTech</div>
                <div className="text-xs text-muted-foreground leading-none">Gaming & Opportunities</div>
              </div>
            </a>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href}>
                <a
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all no-underline"
                  style={{
                    background: location === l.href ? 'rgba(255,95,31,0.2)' : 'transparent',
                    color: location === l.href ? '#ff5f1f' : 'rgba(255,255,255,0.6)',
                    border: location === l.href ? '1px solid rgba(255,95,31,0.35)' : '1px solid transparent',
                  }}
                >
                  {l.emoji} {l.label}
                </a>
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setOpen(o => !o)}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-5 h-0.5 rounded-full transition-all"
                style={{ background: 'rgba(255,255,255,0.7)' }}
              />
            ))}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-72 h-full flex flex-col gap-2 p-4 pt-16"
            style={{
              background: 'hsl(220 20% 8%)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                style={{ background: 'linear-gradient(135deg, #ff5f1f, #dc2626)' }}>
                ✈
              </div>
              <div>
                <div className="font-black" style={{ color: '#ff5f1f' }}>ExpoXTech</div>
                <div className="text-xs text-muted-foreground">Gaming & Opportunities</div>
              </div>
            </div>
            {LINKS.map(l => (
              <Link key={l.href} href={l.href}>
                <a
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold no-underline transition-all"
                  style={{
                    background: location === l.href ? 'rgba(255,95,31,0.15)' : 'rgba(255,255,255,0.04)',
                    color: location === l.href ? '#ff5f1f' : 'rgba(255,255,255,0.7)',
                    border: location === l.href ? '1px solid rgba(255,95,31,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-xl">{l.emoji}</span>
                  {l.label}
                </a>
              </Link>
            ))}
          </div>
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)' }} />
        </div>
      )}

      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}
