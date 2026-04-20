import { useState, useMemo } from 'react';
import { FREE_VISAS, VisaInfo } from '../data/scholarships';
import { BookingModal } from '../components/BookingModal';

const CONTINENTS = ['All', 'Africa', 'Caribbean', 'Central America', 'South America', 'Asia', 'Middle East', 'Europe', 'Pacific'];
const VISA_TYPES = ['All', 'Visa-Free', 'Visa on Arrival', 'eVisa', 'eTA'];

const TYPE_COLORS: Record<string, string> = {
  'Visa-Free': '#22c55e',
  'Visa on Arrival': '#fbbf24',
  'eVisa': '#06b6d4',
  'eTA': '#a855f7',
};

export function VisaPortal() {
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('All');
  const [visaType, setVisaType] = useState('All');
  const [selected, setSelected] = useState<VisaInfo | null>(null);

  const filtered = useMemo(() => {
    return FREE_VISAS.filter(v => {
      const matchCont = continent === 'All' || v.continent === continent;
      const matchType = visaType === 'All' || v.visaType === visaType;
      const matchSearch = !search || v.country.toLowerCase().includes(search.toLowerCase());
      return matchCont && matchType && matchSearch;
    });
  }, [search, continent, visaType]);

  const counts = useMemo(() => ({
    free: FREE_VISAS.filter(v => v.visaType === 'Visa-Free').length,
    onArrival: FREE_VISAS.filter(v => v.visaType === 'Visa on Arrival').length,
    eVisa: FREE_VISAS.filter(v => v.visaType === 'eVisa').length,
  }), []);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'hsl(220 20% 7%)' }}>
      {/* Header */}
      <div
        className="px-4 py-10 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,197,94,0.2) 0%, transparent 70%)' }}
      >
        <div className="text-4xl mb-2">✈️</div>
        <h1 className="font-black text-3xl">Free Visa Countries 🇱🇷</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-lg mx-auto">
          As a Liberian passport holder, here are {FREE_VISAS.length}+ countries you can visit for free or easily.
        </p>
        {/* Stats */}
        <div className="flex justify-center gap-6 mt-5">
          {[
            { n: counts.free, label: 'Visa-Free', color: '#22c55e' },
            { n: counts.onArrival, label: 'On Arrival', color: '#fbbf24' },
            { n: counts.eVisa, label: 'eVisa', color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="font-black text-2xl" style={{ color: s.color }}>{s.n}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-5">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="🔍 Search countries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border outline-none focus:border-primary text-sm transition-colors"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CONTINENTS.map(c => (
              <button
                key={c}
                onClick={() => setContinent(c)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: continent === c ? '#22c55e' : 'rgba(255,255,255,0.06)',
                  color: continent === c ? 'white' : 'rgba(255,255,255,0.5)',
                  border: continent === c ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {VISA_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setVisaType(t)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: visaType === t ? (TYPE_COLORS[t] ?? '#22c55e') : 'rgba(255,255,255,0.06)',
                  color: visaType === t ? (t === 'Visa on Arrival' ? '#000' : 'white') : 'rgba(255,255,255,0.5)',
                  border: visaType === t ? `1px solid ${TYPE_COLORS[t] ?? '#22c55e'}` : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">{filtered.length} countries found</div>

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(v => {
            const tc = TYPE_COLORS[v.visaType] ?? '#22c55e';
            return (
              <div
                key={v.id}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all hover:scale-105 text-center"
                style={{
                  background: `linear-gradient(135deg, ${tc}12, ${tc}04)`,
                  border: `1px solid ${tc}30`,
                }}
                onClick={() => setSelected(v)}
              >
                <div className="text-4xl">{v.flag}</div>
                <div className="font-black text-xs leading-tight">{v.country}</div>
                <div
                  className="px-2 py-0.5 rounded-lg text-xs font-bold"
                  style={{ background: `${tc}20`, color: tc }}
                >
                  {v.visaType}
                </div>
                <div className="text-xs text-muted-foreground">{v.duration}</div>
                <button
                  className="w-full py-1.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all hover:opacity-90 mt-1"
                  style={{ background: '#25D366', color: 'white' }}
                  onClick={e => { e.stopPropagation(); setSelected(v); }}
                >
                  📲 Book
                </button>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div
          className="p-4 rounded-2xl text-xs text-muted-foreground"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <strong className="text-foreground">ℹ️ Disclaimer:</strong> Visa requirements change frequently. Always verify with the official embassy or consulate before traveling. ExpoXTech Gaming provides this information as a guide only. Our team can help you with the visa application process via WhatsApp.
        </div>
      </div>

      {selected && (
        <BookingModal
          title={`${selected.flag} ${selected.country} — ${selected.visaType}`}
          subtitle={`${selected.duration} • ${selected.continent}`}
          type="visa"
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
