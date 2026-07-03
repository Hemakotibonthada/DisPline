import { useId } from 'react';

/**
 * Responsive multi-series line/area chart. Uses non-scaling strokes so lines
 * stay crisp while the SVG stretches to fill its container. Axis labels are
 * rendered as HTML for sharpness.
 * series: [{ name, color, values: number[], area?: bool }]
 */
export function LineChart({ series = [], max, height = 170, labels = [], unit = '', yTicks = 4 }) {
  const uid = useId().replace(/[:]/g, '');
  const W = 600;
  const H = 200;
  const padL = 6;
  const padR = 6;
  const padT = 12;
  const padB = 14;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const n = Math.max(...series.map((s) => s.values.length), 1);
  const mx = max ?? Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => padT + ih - (Math.min(v, mx) / mx) * ih;
  const line = (vals) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = (vals) => `${line(vals)} L${x(vals.length - 1).toFixed(1)} ${padT + ih} L${x(0).toFixed(1)} ${padT + ih} Z`;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => padT + (ih / yTicks) * i);

  return (
    <div className="chart">
      <div className="chart-ymax num">{Math.round(mx)}{unit}</div>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.30" />
              <stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((ty, i) => (
          <line key={i} x1={padL} y1={ty} x2={W - padR} y2={ty} stroke="var(--line-faint)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s, i) => (
          s.area && s.values.length ? <path key={`a${i}`} d={area(s.values)} fill={`url(#${uid}-g${i})`} /> : null
        ))}
        {series.map((s, i) => (
          s.values.length ? <path key={`l${i}`} d={line(s.values)} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /> : null
        ))}
      </svg>
      {labels.length > 0 && (
        <div className="chart-xaxis">
          <span>{labels[0]}</span>
          {labels.length > 2 && <span>{labels[Math.floor(labels.length / 2)]}</span>}
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Simple labeled bar chart (reuses the .bars styles). data: [{label, value, color?}] */
export function BarChart({ data = [], showVal = true }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div className="bar-col" key={i}>
          {showVal && <div className="bar-val num">{d.value}</div>}
          <div className="bar" style={{ height: `${(d.value / max) * 100}%`, background: d.color ? `linear-gradient(180deg, ${d.color}, ${d.color})` : undefined }} title={`${d.value}`} />
          <div className="bar-lbl">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Donut chart. segments: [{label, value, color}]. Shows a centered total/caption. */
export function Donut({ segments = [], size = 150, thickness = 18, centerValue, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={thickness} />
        {total > 0 && segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <div className="num" style={{ fontSize: 22, fontWeight: 800 }}>{centerValue}</div>
        {centerLabel && <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{centerLabel}</div>}
      </div>
    </div>
  );
}
