import { useMemo } from 'react';

export function Stars() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      dur: (Math.random() * 3 + 2).toFixed(1),
      delay: (Math.random() * 4).toFixed(1),
    }));
  }, []);

  return (
    <div className="stars-bg">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--twinkle-dur': `${s.dur}s`,
            '--twinkle-delay': `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
