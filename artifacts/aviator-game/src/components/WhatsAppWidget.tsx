import { useState } from 'react';

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">
      {/* Popup */}
      {open && (
        <div
          className="flex flex-col gap-2 p-3 rounded-2xl w-60 shadow-2xl"
          style={{
            background: 'hsl(220 20% 12%)',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideInUp 0.2s ease-out',
          }}
        >
          <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1 px-1">
            Contact Us 🇱🇷
          </div>
          <a
            href="https://wa.me/231889792996"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)' }}
          >
            <span className="text-xl">📱</span>
            <div>
              <div className="text-xs font-black">Message Admin</div>
              <div className="text-xs opacity-70">+231 889 792 996</div>
            </div>
          </a>
          <a
            href="https://wa.me/231889792996?text=Hi ExpoXTech, I want to apply for a scholarship"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}
          >
            <span className="text-xl">🎓</span>
            <div>
              <div className="text-xs font-black">Scholarship Apply</div>
              <div className="text-xs opacity-70">100+ opportunities</div>
            </div>
          </a>
          <a
            href="https://wa.me/231889792996?text=Hi ExpoXTech, I need visa assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <span className="text-xl">✈️</span>
            <div>
              <div className="text-xs font-black">Visa Assistance</div>
              <div className="text-xs opacity-70">100+ destinations</div>
            </div>
          </a>
          <a
            href="https://chat.whatsapp.com/KOz0JVRuLYq8ySRPaWCKgw?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(255,95,31,0.12)', color: '#ff5f1f', border: '1px solid rgba(255,95,31,0.25)' }}
          >
            <span className="text-xl">👥</span>
            <div>
              <div className="text-xs font-black">Join Community</div>
              <div className="text-xs opacity-70">Group chat</div>
            </div>
          </a>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{ background: '#25D366', boxShadow: '0 4px 24px rgba(37,211,102,0.4)' }}
        aria-label="Contact via WhatsApp"
      >
        {open ? (
          <span className="text-white font-black text-lg">✕</span>
        ) : (
          <svg viewBox="0 0 32 32" fill="white" width="26" height="26">
            <path d="M16 3C8.8 3 3 8.8 3 16c0 2.4.6 4.7 1.8 6.7L3 29l6.5-1.7c1.9 1 4 1.7 6.5 1.7 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.8c-2.2 0-4.3-.6-6.1-1.7l-.4-.3-4 1 1-3.9-.3-.4C5 20.5 4.2 18.3 4.2 16 4.2 9.5 9.5 4.2 16 4.2c6.5 0 11.8 5.3 11.8 11.8C27.8 22.5 22.5 27.8 16 27.8zm6.4-8.8c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.3.4-.9 1.1-1.1 1.4-.2.3-.5.3-.8.1-.4-.2-1.5-.6-2.9-1.8-1.1-.9-1.8-2.1-2-2.5-.2-.3 0-.5.2-.7l.6-.7c.2-.2.2-.4.3-.6.1-.2 0-.5-.1-.7-.2-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6H9.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.8 0 1.7 1.2 3.3 1.4 3.5.2.2 2.4 3.7 5.8 5.1.8.3 1.5.5 1.9.7.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.1-.4-.2-.8-.4z"/>
          </svg>
        )}
        {!open && (
          <span
            className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 animate-pulse"
            style={{ background: '#ff5f1f', borderColor: 'hsl(220 20% 7%)' }}
          />
        )}
      </button>
    </div>
  );
}
