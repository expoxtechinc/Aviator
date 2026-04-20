import { useState, useMemo } from 'react';
import { GameCard } from '../components/GameCard';
import { VIRTUAL_GAMES } from '../data/games';

const CATEGORIES = ['All', 'Football', 'Basketball', 'Racing', 'Combat', 'Cricket', 'Tennis', 'eSports', 'Athletics', 'Winter', 'Aquatics', 'Equestrian'];

export function VirtualGames() {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return VIRTUAL_GAMES.filter(g => {
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
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 70%)' }}
      >
        <div className="text-4xl mb-2">🎮</div>
        <h1 className="font-black text-3xl">Virtual Games</h1>
        <p className="text-muted-foreground text-sm mt-1">50+ virtual sports — results every 3 minutes, 24/7</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-5">
        <input
          type="text"
          placeholder="🔍 Search virtual games..."
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
                background: cat === c ? '#06b6d4' : 'rgba(255,255,255,0.06)',
                color: cat === c ? 'white' : 'rgba(255,255,255,0.5)',
                border: cat === c ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">{filtered.length} virtual games</div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}
