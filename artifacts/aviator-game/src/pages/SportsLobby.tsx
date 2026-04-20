import { useState, useMemo } from 'react';
import { GameCard } from '../components/GameCard';
import { SPORT_GAMES } from '../data/games';

const CATEGORIES = ['All', 'Football', 'Basketball', 'Tennis', 'Cricket', 'Combat', 'eSports', 'Racing', 'Motorsport', 'Golf', 'Rugby', 'Volleyball', 'Athletics', 'Snooker', 'Darts'];

export function SportsLobby() {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return SPORT_GAMES.filter(g => {
      const matchCat = cat === 'All' || g.subcategory === cat;
      const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [cat, search]);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'hsl(220 20% 7%)' }}>
      {/* Header */}
      <div
        className="px-4 py-10 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,197,94,0.15) 0%, transparent 70%)' }}
      >
        <div className="text-4xl mb-2">⚽</div>
        <h1 className="font-black text-3xl">Sports Betting</h1>
        <p className="text-muted-foreground text-sm mt-1">51+ sports & leagues — Football, NBA, UFC, F1, eSports & more</p>
        <div
          className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          🟢 Live betting available
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-5">
        <input
          type="text"
          placeholder="🔍 Search sports..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-card border border-border outline-none focus:border-primary text-sm transition-colors"
        />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: cat === c ? '#22c55e' : 'rgba(255,255,255,0.06)',
                color: cat === c ? 'white' : 'rgba(255,255,255,0.5)',
                border: cat === c ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">{filtered.length} sports</div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        {/* WhatsApp bet CTA */}
        <div
          className="mt-4 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}
        >
          <div className="text-4xl">📲</div>
          <div className="flex-1">
            <div className="font-black">Place Sports Bets via WhatsApp</div>
            <div className="text-sm text-muted-foreground">Message our team to place live bets on any sport above.</div>
          </div>
          <a
            href="https://wa.me/231889792996?text=Hi, I want to place a sports bet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-5 py-2.5 rounded-xl font-black text-sm no-underline"
            style={{ background: '#25D366', color: 'white' }}
          >
            Bet Now
          </a>
        </div>
      </div>
    </div>
  );
}
