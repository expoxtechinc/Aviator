import { useState } from 'react';

const WA_PERSONAL = 'https://wa.me/qr/BH47QXBXBUS6B1';
const WA_GROUP = 'https://chat.whatsapp.com/KOz0JVRuLYq8ySRPaWCKgw?mode=gi_t';

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating WhatsApp button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-4 z-50 flex items-center justify-center rounded-full shadow-2xl transition-all active:scale-95 hover:scale-105"
        style={{
          width: '52px',
          height: '52px',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          boxShadow: '0 4px 20px rgba(37,211,102,0.5)',
        }}
        aria-label="Open WhatsApp"
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.228 6.347L4 29l7.897-2.067C13.44 27.62 14.703 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10c-1.274 0-2.487-.238-3.6-.672l-.52-.204-4.69 1.228 1.299-4.56-.24-.526A9.952 9.952 0 016 15C6 9.477 10.477 5 16 5zm-3.17 5.47c-.2-.448-.41-.46-.6-.468-.155-.007-.333-.006-.51-.006-.177 0-.465.066-.709.333-.244.266-.932.91-.932 2.22 0 1.31.955 2.576 1.087 2.754.133.178 1.844 2.934 4.54 3.997 2.247.887 2.697.71 3.184.666.487-.044 1.57-.643 1.791-1.264.222-.621.222-1.153.155-1.264-.066-.11-.244-.177-.51-.31-.267-.133-1.57-.776-1.813-.864-.244-.089-.421-.133-.599.133-.177.266-.686.864-.84 1.042-.155.178-.31.2-.577.066-.267-.133-1.126-.415-2.145-1.323-.793-.707-1.328-1.58-1.483-1.847-.155-.266-.016-.41.117-.542.12-.12.267-.31.4-.466.133-.155.177-.266.266-.443.089-.178.044-.333-.022-.466-.066-.133-.577-1.454-.8-1.988z"/>
        </svg>
        {/* Notification dot */}
        <span
          className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-background"
          style={{ animation: 'ping 1.5s ease-in-out infinite' }}
        />
      </button>

      {/* Popup */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: '280px',
            background: 'hsl(220 20% 10%)',
            border: '1px solid rgba(37,211,102,0.3)',
            animation: 'slideInUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #075E54, #128C7E)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">✈️</div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">Aviator Community</div>
                <div className="text-green-200 text-xs">Online now — join us!</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white text-xl leading-none"
            >×</button>
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground text-center">
              Join the Aviator community for tips, strategies, and live round discussions!
            </p>

            {/* Personal contact */}
            <a
              href={WA_PERSONAL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #25D366, #1da851)',
                textDecoration: 'none',
              }}
            >
              <svg viewBox="0 0 32 32" width="22" height="22" fill="white">
                <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.228 6.347L4 29l7.897-2.067C13.44 27.62 14.703 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10c-1.274 0-2.487-.238-3.6-.672l-.52-.204-4.69 1.228 1.299-4.56-.24-.526A9.952 9.952 0 016 15C6 9.477 10.477 5 16 5zm-3.17 5.47c-.2-.448-.41-.46-.6-.468-.155-.007-.333-.006-.51-.006-.177 0-.465.066-.709.333-.244.266-.932.91-.932 2.22 0 1.31.955 2.576 1.087 2.754.133.178 1.844 2.934 4.54 3.997 2.247.887 2.697.71 3.184.666.487-.044 1.57-.643 1.791-1.264.222-.621.222-1.153.155-1.264-.066-.11-.244-.177-.51-.31-.267-.133-1.57-.776-1.813-.864-.244-.089-.421-.133-.599.133-.177.266-.686.864-.84 1.042-.155.178-.31.2-.577.066-.267-.133-1.126-.415-2.145-1.323-.793-.707-1.328-1.58-1.483-1.847-.155-.266-.016-.41.117-.542.12-.12.267-.31.4-.466.133-.155.177-.266.266-.443.089-.178.044-.333-.022-.466-.066-.133-.577-1.454-.8-1.988z"/>
              </svg>
              <div>
                <div className="text-white font-bold text-sm">Add Admin</div>
                <div className="text-green-100 text-xs">Chat directly with us</div>
              </div>
            </a>

            {/* Group link */}
            <a
              href={WA_GROUP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'rgba(37,211,102,0.15)',
                border: '1px solid rgba(37,211,102,0.3)',
                textDecoration: 'none',
              }}
            >
              <span className="text-2xl">👥</span>
              <div>
                <div className="text-green-400 font-bold text-sm">Join Group</div>
                <div className="text-muted-foreground text-xs">Aviator community chat</div>
              </div>
            </a>

            <p className="text-center text-xs text-muted-foreground">
              Daily signals · Strategy tips · Live wins 🚀
            </p>
          </div>
        </div>
      )}
    </>
  );
}
