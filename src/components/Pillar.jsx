import { useEffect, useRef, useState } from 'react';
import MomentumTimer from './MomentumTimer.jsx';

/**
 * One pillar of the Rule of 2. Holds exactly ONE non-negotiable for today —
 * there is only a single slot, so a second goal can never be added. Completing
 * it fires a clean emerald celebration.
 */
export default function Pillar({
  config,
  glyph,
  goal,
  goalDone,
  summaryItems = [],
  timerState,
  onSetGoal,
  onToggleDone,
  onClearGoal,
  onTimerChange,
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [burst, setBurst] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const prevDone = useRef(goalDone);

  useEffect(() => {
    if (goalDone && !prevDone.current) {
      setBurst(true);
      setCelebrate(true);
      const t1 = setTimeout(() => setBurst(false), 720);
      const t2 = setTimeout(() => setCelebrate(false), 720);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    prevDone.current = goalDone;
    return undefined;
  }, [goalDone]);

  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onSetGoal(text);
    setDraft('');
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(goal);
    setEditing(true);
  };

  const hasGoal = !!goal && !editing;

  return (
    <div
      className={`pillar${goalDone ? ' is-complete' : ''}${celebrate ? ' celebrate' : ''}`}
      data-accent={config.accent}
    >
      {burst && <div className="burst" />}

      <div className="pillar-top">
        <div className="pillar-id">
          <div className="pillar-glyph">{glyph}</div>
          <div>
            <div className="pillar-name">{config.name}</div>
            <div className="pillar-focus">{config.focus}</div>
          </div>
        </div>
        <div className="pillar-tag">PILLAR · {config.short.toUpperCase()}</div>
      </div>

      <div className="slot">
        <div className="slot-label">
          <span className="lock">🎯</span> Daily Non-Negotiable
          <span style={{ marginLeft: 'auto', color: 'var(--text-ghost)', letterSpacing: '0.5px' }}>1 / 1</span>
        </div>

        {hasGoal ? (
          <div className={`goal-locked${goalDone ? ' done' : ''}`}>
            <button
              className="goal-check"
              onClick={onToggleDone}
              aria-pressed={goalDone}
              aria-label={goalDone ? 'Mark as not done' : 'Mark as complete'}
              title={goalDone ? 'Completed' : 'Mark complete'}
            >
              ✓
            </button>
            <div className="goal-text">
              <div className="g">{goal}</div>
              <div className="meta">
                <span className={`goal-status ${goalDone ? 'locked-in' : 'pending'}`}>
                  {goalDone ? '✓ Locked In' : '● Pending'}
                </span>
                <button className="goal-edit" onClick={startEdit}>edit</button>
                <button className="goal-edit" onClick={onClearGoal}>clear</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="goal-input">
            <input
              type="text"
              value={draft}
              placeholder={config.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setDraft('');
                }
              }}
              maxLength={120}
              autoFocus={editing}
            />
            <button onClick={commit} disabled={!draft.trim()}>
              Lock In
            </button>
          </div>
        )}
      </div>

      <MomentumTimer accent={config.accent} state={timerState} onChange={onTimerChange} />

      {summaryItems.length > 0 && (
        <div className="pillar-metrics">
          {summaryItems.map((it) => (
            <div className="metric-row" key={it.label}>
              <span className="k">
                <span className="mi">{it.icon}</span>
                {it.label}
              </span>
              <span
                className="mono"
                style={{ fontWeight: 700, fontSize: 13, color: it.on ? 'var(--emerald-bright)' : 'var(--text-muted)' }}
              >
                {it.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
