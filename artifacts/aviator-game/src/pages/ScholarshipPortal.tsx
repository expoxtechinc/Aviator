import { useState, useMemo } from 'react';
import { SCHOLARSHIPS, Scholarship } from '../data/scholarships';
import { BookingModal } from '../components/BookingModal';

const LEVELS = ['All', 'Undergrad', 'Masters', 'PhD', 'Fellowship', 'Professional', 'Certificate', 'Short-course'];
const CONTINENTS = ['All', 'Europe', 'North America', 'Asia', 'Africa', 'Middle East', 'Pacific', 'Online'];

export function ScholarshipPortal() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [selected, setSelected] = useState<Scholarship | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);

  const filtered = useMemo(() => {
    return SCHOLARSHIPS.filter(s => {
      const matchLevel = level === 'All' || s.level.includes(level);
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.country.toLowerCase().includes(search.toLowerCase());
      const matchFeatured = !showFeatured || s.featured;
      return matchLevel && matchSearch && matchFeatured;
    });
  }, [search, level, showFeatured]);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'hsl(220 20% 7%)' }}>
      {/* Header */}
      <div
        className="px-4 py-10 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168,85,247,0.2) 0%, transparent 70%)' }}
      >
        <div className="text-4xl mb-2">🎓</div>
        <h1 className="font-black text-3xl">Free Scholarships 🇱🇷</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-lg mx-auto">
          {SCHOLARSHIPS.length}+ fully-funded scholarships for Liberian students to study worldwide. All free to apply.
        </p>
        <div
          className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
        >
          📲 All bookings handled via WhatsApp
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-5">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="🔍 Search scholarships, countries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border outline-none focus:border-primary text-sm transition-colors"
          />

          <div className="flex items-center gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: level === l ? '#a855f7' : 'rgba(255,255,255,0.06)',
                    color: level === l ? 'white' : 'rgba(255,255,255,0.5)',
                    border: level === l ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFeatured(f => !f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: showFeatured ? '#fbbf24' : 'rgba(255,255,255,0.06)',
                color: showFeatured ? '#000' : 'rgba(255,255,255,0.5)',
                border: showFeatured ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              ⭐ Featured
            </button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">{filtered.length} scholarships found</div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div
              key={s.id}
              className="flex flex-col gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: s.featured
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.04))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: s.featured ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(255,255,255,0.07)',
              }}
              onClick={() => setSelected(s)}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="text-3xl">{s.flag}</div>
                <div className="flex flex-col items-end gap-1">
                  {s.featured && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-black" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                      ⭐ Featured
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                    {s.level.split('/')[0].trim()}
                  </span>
                </div>
              </div>

              <div>
                <div className="font-black text-sm leading-tight">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.country}</div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-400">💰</span>
                  <span className="text-muted-foreground">{s.coverage}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>📚</span>
                  <span className="text-muted-foreground">{s.fields}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>📅</span>
                  <span className="text-muted-foreground">Deadline: {s.deadline}</span>
                </div>
              </div>

              <button
                className="w-full py-2 rounded-xl font-black text-xs uppercase tracking-wide transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white' }}
                onClick={e => { e.stopPropagation(); setSelected(s); }}
              >
                📲 Apply via WhatsApp
              </button>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <BookingModal
          title={selected.name}
          subtitle={`${selected.country} • ${selected.level}`}
          type="scholarship"
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
