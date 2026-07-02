import { clamp } from '../../lib/format.js';

/** Generic circular progress ring with centered content. */
export default function Ring({ value = 0, max = 100, size = 120, stroke = 10, color = 'var(--brand)', children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = clamp(max === 0 ? 0 : value / max, 0, 1);
  const offset = circ * (1 - pct);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="rt" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="rp"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
