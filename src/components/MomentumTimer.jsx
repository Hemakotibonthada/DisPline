import { useEffect, useState } from 'react';
import { formatClock } from '../lib/format.js';

const DURATION = 300; // 5:00
const R = 22;
const STROKE = 5;
const CIRC = 2 * Math.PI * R;

function remainingFrom(state) {
  if (state.running && state.endsAt) {
    return Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
  }
  return state.remaining ?? DURATION;
}

/**
 * 5-minute "beat the friction" countdown. Persistence is timestamp-based
 * (endsAt), so a running timer survives a refresh and stays accurate.
 */
export default function MomentumTimer({ accent = 'blue', state, onChange }) {
  const [remaining, setRemaining] = useState(() => remainingFrom(state));

  useEffect(() => {
    setRemaining(remainingFrom(state));
    if (!state.running) return undefined;
    const id = setInterval(() => {
      const rem = remainingFrom(state);
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(id);
        onChange({ running: false, endsAt: null, remaining: 0, completed: true });
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.running, state.endsAt]);

  const start = () => {
    const rem = remaining > 0 ? remaining : DURATION;
    onChange({ running: true, endsAt: Date.now() + rem * 1000, remaining: rem, completed: false });
  };
  const pause = () => onChange({ running: false, endsAt: null, remaining, completed: state.completed });
  const reset = () => {
    setRemaining(DURATION);
    onChange({ running: false, endsAt: null, remaining: DURATION, completed: false });
  };

  const done = state.completed || (!state.running && remaining <= 0);
  const progress = done ? 1 : 1 - remaining / DURATION;
  const offset = CIRC * (1 - progress);
  const size = (R + STROKE) * 2;

  const cls = `momentum${state.running ? ' running' : ''}${done ? ' done' : ''}`;

  return (
    <div className={cls} data-accent={accent} style={accentVars(accent)}>
      <div className="mtimer-ring">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle className="rt" cx={size / 2} cy={size / 2} r={R} fill="none" strokeWidth={STROKE} />
          <circle
            className="rp"
            cx={size / 2}
            cy={size / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="rc">{done ? '✓' : formatClock(remaining)}</div>
      </div>

      <div className="momentum-body">
        <div className="mt-title">
          <span>⚡ Momentum Timer</span>
        </div>
        <div className="mt-sub">
          {done ? 'Friction beaten — keep going.' : state.running ? 'Deep work in progress…' : '5 minutes. Just start.'}
        </div>
      </div>

      <div className="momentum-actions">
        {state.running ? (
          <button className="mbtn" onClick={pause}>
            <span className="ic">⏸</span> Pause
          </button>
        ) : (
          <button className="mbtn primary" onClick={start}>
            <span className="ic">▶</span> {remaining < DURATION && remaining > 0 ? 'Resume' : 'Start'}
          </button>
        )}
        <button className="mbtn ghost" onClick={reset} title="Reset to 05:00">
          ↺
        </button>
      </div>
    </div>
  );
}

function accentVars(accent) {
  return accent === 'emerald'
    ? { '--accent': 'var(--emerald-bright)', '--accent-dim': 'var(--emerald-dim)' }
    : { '--accent': 'var(--blue-bright)', '--accent-dim': 'var(--blue-dim)' };
}
