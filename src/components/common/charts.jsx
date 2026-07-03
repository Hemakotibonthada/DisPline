import { useEffect, useId, useState } from 'react';
import { clamp } from '../../lib/format.js';

/* Build a smooth (Catmull-Rom -> cubic bezier) path through points. */
function smoothPath(pts, smoothing = 0.18) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]} ${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) * smoothing;
    const c1y = p1[1] + (p2[1] - p0[1]) * smoothing;
    const c2x = p2[0] - (p3[0] - p1[0]) * smoothing;
    const c2y = p2[1] - (p3[1] - p1[1]) * smoothing;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Google Fit–style activity rings: concentric rounded progress arcs.
 * rings: [{ label, value, max, color }] (outer first).
 */
export function ActivityRings({ rings = [], size = 196, thickness = 15, gap = 7, children }) {
  const cx = size / 2;
  const cy = size / 2;
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="rings" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r, i) => {
          const radius = size / 2 - thickness / 2 - i * (thickness + gap);
          const circ = 2 * Math.PI * radius;
          const pct = clamp(r.max ? r.value / r.max : 0, 0, 1);
          return (
            <g key={r.label || i}>
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke={r.color} strokeOpacity="0.16" strokeWidth={thickness} />
              <circle
                className="ring-arc"
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={on ? circ * (1 - pct) : circ}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            </g>
          );
        })}
      </svg>
      {children ? <div className="rings-center">{children}</div> : null}
    </div>
  );
}

/**
 * Smooth area/line chart (Google Fit style). series: [{ name, color, values, area }].
 */
export function LineChart({ series = [], max, height = 170, labels = [], unit = '', yTicks = 4 }) {
  const uid = useId().replace(/[:]/g, '');
  const W = 600;
  const H = 200;
  const padL = 6;
  const padR = 6;
  const padT = 14;
  const padB = 14;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const n = Math.max(...series.map((s) => s.values.length), 1);
  const mx = max ?? Math.max(1, ...series.flatMap((s) => s.values));
  const pt = (vals) => vals.map((v, i) => [padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw), padT + ih - (Math.min(v, mx) / mx) * ih]);
  const areaFrom = (pts) => `${smoothPath(pts)} L${pts[pts.length - 1][0].toFixed(1)} ${padT + ih} L${pts[0][0].toFixed(1)} ${padT + ih} Z`;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => padT + (ih / yTicks) * i);

  return (
    <div className="chart">
      <div className="chart-ymax">{Math.round(mx)}{unit}</div>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.32" />
              <stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((ty, i) => (
          <line key={i} x1={padL} y1={ty} x2={W - padR} y2={ty} stroke="var(--line-faint)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s, i) => {
          if (!s.values.length) return null;
          const pts = pt(s.values);
          return (
            <g key={i}>
              {s.area && <path d={areaFrom(pts)} fill={`url(#${uid}-g${i})`} />}
              <path d={smoothPath(pts)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
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

/** Google-style bar chart: rounded pills over a soft track. data: [{label, value, color?}] */
export function BarChart({ data = [], showVal = true }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="gbars">
      {data.map((d, i) => (
        <div className="gbar-col" key={i}>
          {showVal && <div className="gbar-val">{d.value}</div>}
          <div className="gbar-track">
            <div className="gbar-fill" style={{ height: `${(d.value / max) * 100}%`, background: d.color || 'var(--g-blue)' }} title={`${d.value}`} />
          </div>
          <div className="gbar-lbl">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Donut chart. segments: [{label, value, color}]. */
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
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{centerValue}</div>
        {centerLabel && <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{centerLabel}</div>}
      </div>
    </div>
  );
}
