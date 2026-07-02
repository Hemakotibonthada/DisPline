import { useEffect, useRef, useState } from 'react';
import Ring from '../common/Ring.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import { formatClock, formatDuration } from '../../lib/format.js';
import { CATEGORY_LIST, CATEGORIES } from '../../store/defaults.js';

const FKEY = 'des.focus.timer.v1';
const PRESETS = [5, 15, 25, 50];

function loadTimer() {
  try {
    const raw = JSON.parse(localStorage.getItem(FKEY) || 'null');
    if (raw) return raw;
  } catch { /* ignore */ }
  return { running: false, endsAt: null, remaining: 25 * 60, durationMin: 25, category: 'mental' };
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function FocusView() {
  const { state, actions, derived } = useStore();
  const [timer, setTimer] = useState(loadTimer);
  const [, setNow] = useState(Date.now());
  const loggedRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem(FKEY, JSON.stringify(timer)); } catch { /* ignore */ }
  }, [timer]);

  const remaining = timer.running && timer.endsAt
    ? Math.max(0, Math.round((timer.endsAt - Date.now()) / 1000))
    : timer.remaining;

  useEffect(() => {
    if (!timer.running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer.running]);

  useEffect(() => {
    if (timer.running && remaining <= 0 && !loggedRef.current) {
      loggedRef.current = true;
      actions.logFocus({ minutes: timer.durationMin, type: 'focus', category: timer.category });
      actions.pushToast({ type: 'level', title: 'Focus complete 🎯', msg: `${timer.durationMin} min logged`, icon: '🎯' });
      setTimer((t) => ({ ...t, running: false, endsAt: null, remaining: t.durationMin * 60 }));
    }
    if (remaining > 0) loggedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timer.running]);

  const start = () => {
    const rem = remaining > 0 ? remaining : timer.durationMin * 60;
    loggedRef.current = false;
    setTimer((t) => ({ ...t, running: true, endsAt: Date.now() + rem * 1000, remaining: rem }));
  };
  const pause = () => setTimer((t) => ({ ...t, running: false, endsAt: null, remaining }));
  const reset = () => setTimer((t) => ({ ...t, running: false, endsAt: null, remaining: t.durationMin * 60 }));
  const setPreset = (min) => setTimer((t) => ({ ...t, running: false, endsAt: null, durationMin: min, remaining: min * 60 }));

  const total = timer.durationMin * 60;
  const cat = CATEGORIES[timer.category] || CATEGORIES.mental;

  return (
    <div className="view stack">
      <div className="vtitle"><h2>Focus</h2></div>
      <p className="view-sub">Deep, single-tasked blocks. Beat friction — just press start.</p>

      <div className="focus-wrap">
        <section className="panel focus-timer">
          <Ring value={total - remaining} max={total} size={220} stroke={14} color={timer.running ? 'var(--brand)' : 'var(--text-muted)'}>
            <div style={{ textAlign: 'center' }}>
              <div className="focus-ring-num" style={{ color: timer.running ? 'var(--brand)' : 'var(--text)' }}>{formatClock(remaining)}</div>
              <div className="focus-ring-lbl">{timer.running ? 'In focus' : remaining < total ? 'Paused' : 'Ready'}</div>
            </div>
          </Ring>

          <div className="focus-presets">
            {PRESETS.map((m) => (
              <button key={m} className={`chip${timer.durationMin === m ? ' active' : ''}`} onClick={() => setPreset(m)} disabled={timer.running}>
                {m} min
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Category</span>
            {CATEGORY_LIST.map((c) => (
              <button key={c.id} className={`chip${timer.category === c.id ? ' active' : ''}`} onClick={() => setTimer((t) => ({ ...t, category: c.id }))} title={c.label}>
                {c.icon}
              </button>
            ))}
          </div>

          <div className="focus-controls">
            {timer.running ? (
              <button className="btn" onClick={pause} style={{ minWidth: 120 }}>⏸ Pause</button>
            ) : (
              <button className="btn solid" onClick={start} style={{ minWidth: 120 }}>▶ {remaining < total ? 'Resume' : 'Start'}</button>
            )}
            <button className="btn ghost" onClick={reset}>↺ Reset</button>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
            Completing a session earns <b style={{ color: cat.color }}>{cat.label}</b> XP. Timer keeps running across the app.
          </div>
        </section>

        <section className="panel panel-p stack">
          <div className="grid g2">
            <div className="statcard accent">
              <div className="sc-top">🎯 Sessions</div>
              <div className="sc-v num">{derived.stats.focusSessions}</div>
            </div>
            <div className="statcard accent">
              <div className="sc-top">⏱ Total Focus</div>
              <div className="sc-v num">{formatDuration(derived.stats.focusMinutes)}</div>
            </div>
          </div>

          <div>
            <div className="section-h"><h3>Recent sessions</h3></div>
            <div className="focus-hist">
              {state.focusSessions.length === 0 && <div className="empty"><div className="big">🎯</div>No focus sessions yet.</div>}
              {state.focusSessions.slice(0, 40).map((f) => {
                const c = CATEGORIES[f.category] || CATEGORIES.mental;
                return (
                  <div className="focus-row" key={f.id}>
                    <span style={{ fontSize: 16 }}>{c.icon}</span>
                    <span className="fmin num">{f.minutes}m</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{c.label}</span>
                    <span className="fwhen">{timeAgo(f.at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
