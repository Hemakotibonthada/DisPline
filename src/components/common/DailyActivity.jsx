import { useStore } from '../../store/StoreContext.jsx';
import { ActivityRings } from './charts.jsx';
import { disciplineScore, getDay } from '../../lib/discipline.js';
import { todayKey } from '../../lib/dateUtils.js';

function Metric({ color, label, value, sub }) {
  return (
    <div className="gfit-metric">
      <span className="gfit-dot" style={{ background: color, color }} />
      <div className="gm-body">
        <div className="gm-label">{label}</div>
        <div className="gm-value">{value}{sub ? <small> {sub}</small> : null}</div>
      </div>
    </div>
  );
}

/** Google Fit–style daily activity rings: Discipline / Actions / Focus. */
export default function DailyActivity() {
  const { state, actions } = useStore();
  const today = todayKey();
  const day = getDay(state.days, today);

  const discipline = disciplineScore(day);
  const micro = (state.microActions[today] || []).filter((a) => !a.skipped);
  const microDone = micro.filter((a) => a.done).length;
  const nonNegDone = (day.technical.goal && day.technical.goalDone ? 1 : 0) + (day.physical.goal && day.physical.goalDone ? 1 : 0);
  const habits = state.habits || [];
  const habitsDone = habits.filter((h) => h.logs && h.logs[today]).length;
  const actionsValue = microDone + nonNegDone + habitsDone;
  const actionsMax = Math.max(1, micro.length + 2 + habits.length);
  const focusMin = state.focusSessions.filter((f) => (f.at || '').slice(0, 10) === today).reduce((s, f) => s + (f.minutes || 0), 0);
  const focusGoal = 30;
  const waterToday = state.water[today] || 0;

  const rings = [
    { label: 'Discipline', value: discipline, max: 100, color: 'var(--g-blue)' },
    { label: 'Actions', value: actionsValue, max: actionsMax, color: 'var(--g-green)' },
    { label: 'Focus', value: focusMin, max: focusGoal, color: 'var(--g-teal)' },
  ];

  return (
    <section className="panel panel-p">
      <div className="section-h">
        <h3>💫 Daily Activity</h3>
        <span className="hint">rings close as you execute</span>
      </div>
      <div className="gfit">
        <ActivityRings rings={rings} size={200} thickness={16} gap={7}>
          <div>
            <div className="rc-big">{discipline}<span style={{ fontSize: 16 }}>%</span></div>
            <div className="rc-sub">Discipline</div>
          </div>
        </ActivityRings>
        <div className="gfit-legend">
          <Metric color="var(--g-blue)" label="Discipline" value={`${discipline}%`} />
          <Metric color="var(--g-green)" label="Actions completed" value={actionsValue} sub={`/ ${actionsMax}`} />
          <Metric color="var(--g-teal)" label="Focus" value={focusMin} sub={`/ ${focusGoal} min`} />
          <button className="btn block ghost" style={{ marginTop: 2 }} onClick={() => actions.addWater(1)}>
            💧 +1 Glass of Water ({waterToday}/{state.waterGoal})
          </button>
        </div>
      </div>
    </section>
  );
}
