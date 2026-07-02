import { useEffect, useRef, useState } from 'react';

const R = 52;
const STROKE = 10;
const CIRC = 2 * Math.PI * R;

function colorFor(score) {
  if (score >= 100) return 'var(--emerald-bright)';
  if (score >= 50) return 'var(--blue-bright)';
  if (score > 0) return 'var(--amber-bright)';
  return 'var(--text-ghost)';
}

/**
 * Circular 0–100 discipline gauge. The number counts up smoothly and the ring
 * shifts colour as the day's two non-negotiables get locked in.
 */
export default function DisciplineGauge({ score, caption }) {
  const [display, setDisplay] = useState(score);
  const fromRef = useRef(score);

  useEffect(() => {
    const from = fromRef.current;
    const to = score;
    if (from === to) return undefined;
    const dur = 750;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      setDisplay(val);
      fromRef.current = val;
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = CIRC * (1 - display / 100);
  const size = (R + STROKE) * 2;

  return (
    <div className="gauge-wrap" style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
      <div className={`gauge${score >= 100 ? ' is-full' : ''}`} style={{ color: colorFor(display) }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle className="track" cx={size / 2} cy={size / 2} r={R} fill="none" strokeWidth={STROKE} />
          <circle
            className="progress"
            cx={size / 2}
            cy={size / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeDasharray={CIRC}
            strokeDashoffset={display <= 0 ? CIRC : offset}
          />
        </svg>
        <div className="center">
          <div className="value mono" style={{ color: display >= 100 ? 'var(--emerald-bright)' : 'var(--text)' }}>
            {display}
            <span className="pct">%</span>
          </div>
          <div className="cap">Discipline</div>
        </div>
      </div>
      {caption ? <div className="gauge-caption">{caption}</div> : null}
    </div>
  );
}
