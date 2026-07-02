import { formatShortDate, isFuture, isToday, keyToDate, weekdayLabels } from '../lib/dateUtils.js';

const STATUS_LABEL = { win: 'Win', miss: 'Miss', null: 'Unmarked' };

/**
 * Don't Break the Chain — a dense 4-week (28 day) grid. Click any past/today
 * cell to cycle Unmarked → Win → Miss. Future days are a dimmed lookahead.
 */
export default function HabitChain({ window, getStatus, onCycle, currentStreak, longestStreak, windowWins }) {
  const weeks = [0, 1, 2, 3].map((w) => window.slice(w * 7, w * 7 + 7));

  return (
    <section className="card chain enter d2">
      <div className="chain-head">
        <div className="chain-title">
          <h2>Don&apos;t Break the Chain</h2>
          <span className="sub">28-day rolling grid · click a day to log the outcome</span>
        </div>
        <div className="chain-legend">
          <span><i className="win" /> Win</span>
          <span><i className="miss" /> Miss</span>
          <span><i className="none" /> Open</span>
        </div>
      </div>

      <div className="chain-grid">
        <div className="chain-weekdays">
          {weekdayLabels().map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div className="chain-week" key={wi}>
            {week.map((key) => {
              const status = getStatus(key);
              const future = isFuture(key);
              const today = isToday(key);
              const dnum = keyToDate(key).getDate();
              const cls = [
                'day-cell',
                status || '',
                today ? 'today' : '',
                future ? 'future' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={key}
                  className={cls}
                  disabled={future}
                  onClick={() => !future && onCycle(key)}
                  title={`${formatShortDate(key)} · ${STATUS_LABEL[status ?? 'null']}${today ? ' · Today' : ''}`}
                  aria-label={`${formatShortDate(key)} ${STATUS_LABEL[status ?? 'null']}`}
                >
                  {status === 'win' ? <span className="mark">✓</span> : <span className="dnum">{dnum}</span>}
                  {today && status !== 'win' && <span className="todaydot" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="chain-foot">
        <div className="chain-stat active">
          <div className="big mono">
            {currentStreak}
            <small>days</small>
          </div>
          <div className="lab">🔥 Current Streak</div>
        </div>
        <div className="chain-stat record">
          <div className="big mono">
            {longestStreak}
            <small>days</small>
          </div>
          <div className="lab">◇ Longest Ever</div>
        </div>
        <div className="chain-stat">
          <div className="big mono">
            {windowWins}
            <small>/ 28</small>
          </div>
          <div className="lab">Wins This Window</div>
        </div>
      </div>
    </section>
  );
}
