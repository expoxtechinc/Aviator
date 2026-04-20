import { Link } from 'wouter';

export function Footer() {
  return (
    <footer
      className="mt-8 px-4 py-6"
      style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #ff5f1f, #dc2626)' }}>
            ✈
          </div>
          <div className="font-black" style={{ color: '#ff5f1f' }}>ExpoXTech Gaming</div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          {[
            ['/casino', 'Casino'],
            ['/virtual', 'Virtual'],
            ['/sports', 'Sports'],
            ['/spin', 'Spin & Win'],
            ['/scholarships', 'Scholarships 🇱🇷'],
            ['/visas', 'Free Visas ✈️'],
          ].map(([href, label]) => (
            <Link key={href} href={href}>
              <a className="hover:text-foreground transition-colors no-underline">{label}</a>
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://wa.me/231889792996"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
          >
            📱 +231 889 792 996
          </a>
          <a
            href="https://chat.whatsapp.com/KOz0JVRuLYq8ySRPaWCKgw?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
          >
            👥 Join Community
          </a>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-md">
          ExpoXTech Gaming — Liberia's #1 Entertainment & Opportunities Platform 🇱🇷<br/>
          18+ only. Game responsibly. All games are for entertainment purposes only.
        </p>
      </div>
    </footer>
  );
}
