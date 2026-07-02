import { formatDuration } from '../lib/format.js';

/**
 * Input Metric Logs — raw inputs, no fluff. Deep-work minutes on the technical
 * side; workout + protein toggles on the physical side. A 7-day table underneath
 * makes consistency (or its absence) impossible to hide from.
 */
export default function MetricLogs({
  deepWorkMinutes,
  workoutDone,
  nutritionDone,
  history,
  onDeepWorkDelta,
  onDeepWorkSet,
  onToggleWorkout,
  onToggleNutrition,
}) {
  return (
    <section className="card metrics enter d3">
      <div className="metrics-head">
        <div>
          <h2>Input Metric Logs</h2>
          <div className="sub">Track the inputs. The outputs follow.</div>
        </div>
        <div className="section-label" style={{ letterSpacing: '1.6px' }}>
          <span className="dot" style={{ background: 'var(--emerald-bright)', boxShadow: '0 0 10px var(--emerald)' }} />
          TODAY
        </div>
      </div>

      <div className="quicklog">
        <div className="ql-card" data-accent="blue">
          <div className="ql-head">
            <span className="ic">⏱</span>
            <span className="t">Deep Work</span>
          </div>
          <div className="ql-big mono">
            {formatDuration(deepWorkMinutes)}
            {deepWorkMinutes >= 120 && <small>· locked in</small>}
          </div>
          <div className="ql-controls">
            <button className="chip-btn" onClick={() => onDeepWorkDelta(-15)} disabled={deepWorkMinutes <= 0}>
              −15
            </button>
            <button className="chip-btn accent" onClick={() => onDeepWorkDelta(15)}>+15</button>
            <button className="chip-btn accent" onClick={() => onDeepWorkDelta(30)}>+30</button>
            <button className="chip-btn accent" onClick={() => onDeepWorkDelta(60)}>+60</button>
            <button className="chip-btn" onClick={() => onDeepWorkSet(0)} disabled={deepWorkMinutes <= 0}>
              reset
            </button>
          </div>
        </div>

        <div className="ql-card" data-accent="emerald">
          <div className="ql-head">
            <span className="ic">💪</span>
            <span className="t">Physical</span>
          </div>
          <div className="ql-toggle-row">
            <span className="lbl">🏋 Workout completed</span>
            <button
              className={`toggle${workoutDone ? ' on' : ''}`}
              onClick={onToggleWorkout}
              role="switch"
              aria-checked={workoutDone}
              aria-label="Workout completed"
            />
          </div>
          <div className="ql-toggle-row">
            <span className="lbl">🍗 Protein target met</span>
            <button
              className={`toggle${nutritionDone ? ' on' : ''}`}
              onClick={onToggleNutrition}
              role="switch"
              aria-checked={nutritionDone}
              aria-label="Protein target met"
            />
          </div>
        </div>
      </div>

      <div className="history">
        <div className="history-title">Last 7 Days</div>
        <table className="htable">
          <thead>
            <tr>
              <th>Day</th>
              <th className="num">Deep Work</th>
              <th className="num hide-sm">Workout</th>
              <th className="num hide-sm">Protein</th>
              <th className="num">Result</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.key} className={row.isToday ? 'is-today' : ''}>
                <td className="day">
                  {row.dateLabel}
                  <span className="wd">{row.weekday}</span>
                  {row.isToday && <span className="wd" style={{ color: 'var(--amber-bright)' }}>· today</span>}
                </td>
                <td className="num">{row.deepWorkMinutes > 0 ? formatDuration(row.deepWorkMinutes) : '—'}</td>
                <td className="num hide-sm">
                  <span className={`pip ${row.workoutDone ? 'on' : 'off'}`} />
                </td>
                <td className="num hide-sm">
                  <span className={`pip ${row.nutritionDone ? 'on' : 'off'}`} />
                </td>
                <td className="num">
                  <span className={`st-badge ${row.status ?? 'none'}`}>
                    {row.status === 'win' ? 'WIN' : row.status === 'miss' ? 'MISS' : '·'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
