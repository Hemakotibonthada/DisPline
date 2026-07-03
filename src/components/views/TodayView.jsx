import { useState } from 'react';
import Header from '../Header.jsx';
import FocusBoard from '../FocusBoard.jsx';
import HabitChain from '../HabitChain.jsx';
import MetricLogs from '../MetricLogs.jsx';
import DailyActivity from '../common/DailyActivity.jsx';
import { useStore } from '../../store/StoreContext.jsx';
import {
  currentStreak,
  disciplineScore,
  getDay,
  longestStreak,
  neverMissTwice,
  statusOf,
} from '../../lib/discipline.js';
import {
  buildChainWindow,
  addDays,
  formatLongDate,
  formatShortDate,
  lastNDays,
  shortWeekday,
  todayKey,
} from '../../lib/dateUtils.js';
import { AFFIRMATIONS, CATEGORIES, CATEGORY_LIST, pickDaily } from '../../store/defaults.js';

export default function TodayView() {
  const { state, actions } = useStore();
  const [custom, setCustom] = useState('');
  const [customCat, setCustomCat] = useState('health');

  const today = todayKey();
  const days = state.days;
  const todayDay = getDay(days, today);
  const chainWindow = buildChainWindow(today);

  const score = disciplineScore(todayDay);
  const cs = currentStreak(days, today);
  const ls = Math.max(longestStreak(days), cs);
  const windowWins = chainWindow.filter((k) => statusOf(days, k) === 'win').length;
  const nmt = neverMissTwice(days, today);

  const tGoalDone = !!todayDay.technical.goal && todayDay.technical.goalDone;
  const pGoalDone = !!todayDay.physical.goal && todayDay.physical.goalDone;
  const bothSet = !!todayDay.technical.goal && !!todayDay.physical.goal;
  let scoreCaption;
  if (tGoalDone && pGoalDone) scoreCaption = 'System secured. Both non-negotiables locked in.';
  else if (tGoalDone || pGoalDone) scoreCaption = 'Halfway there — one pillar still open.';
  else if (bothSet) scoreCaption = 'Locked and loaded. Now execute.';
  else scoreCaption = 'Set your two non-negotiables to begin.';

  const history = lastNDays(7, today)
    .slice()
    .reverse()
    .map((key) => {
      const d = getDay(days, key);
      return {
        key,
        dateLabel: formatShortDate(key),
        weekday: shortWeekday(key),
        isToday: key === today,
        deepWorkMinutes: d.technical.deepWorkMinutes,
        workoutDone: d.physical.workoutDone,
        nutritionDone: d.physical.nutritionDone,
        status: statusOf(days, key),
      };
    });

  const micro = (state.microActions[today] || []).filter((a) => !a.skipped);
  const microDone = micro.filter((a) => a.done).length;
  const affirmation = pickDaily(AFFIRMATIONS, today);
  const shields = state.gamification.streakShields || 0;
  const showShield = nmt.missedYesterday && shields > 0;

  const addCustom = () => {
    if (!custom.trim()) return;
    actions.addCustomMicro(customCat, custom);
    setCustom('');
  };

  return (
    <div className="view stack">
      <Header
        dateLabel={formatLongDate(today)}
        score={score}
        scoreCaption={scoreCaption}
        nmt={nmt}
        currentStreak={cs}
        longestStreak={ls}
      />

      {showShield && (
        <div className="shield-banner">
          <span className="sb-ic">🛡️</span>
          <div>
            <div className="sb-t">Your streak is at risk</div>
            <div className="sb-d">Yesterday was a miss. Spend a Streak Shield ({shields} left) to restore it and keep your chain alive.</div>
          </div>
          <button className="btn solid sb-btn" onClick={() => actions.useStreakShield(addDays(today, -1))}>Use Shield 🛡️</button>
        </div>
      )}

      <div className="affirm panel">
        <div className="ic">✦</div>
        <div>
          <div className="lbl">Daily Affirmation</div>
          <div className="q">{affirmation}</div>
        </div>
      </div>

      <FocusBoard
        tech={todayDay.technical}
        phys={todayDay.physical}
        timers={{ technical: state.timers.technical, physical: state.timers.physical }}
        onSetGoal={actions.setGoal}
        onToggleDone={actions.toggleGoalDone}
        onClearGoal={actions.clearGoal}
        onTimerChange={actions.setTimer}
      />

      <div className="today-grid">
        <section className="panel micro-panel" style={{ padding: 20 }}>
          <div className="section-h">
            <h3>⚡ 2-Minute Micro-Actions</h3>
            <button className="btn sm ghost" onClick={actions.refreshMicro}>↺ Refresh</button>
          </div>
          <p className="view-sub" style={{ marginTop: 0, marginBottom: 14 }}>
            Small enough to be unskippable · <b className="num">{microDone}/{micro.length}</b> done
          </p>
          <div className="micro-list">
            {micro.map((a) => {
              const cat = CATEGORIES[a.category] || CATEGORIES.mental;
              return (
                <div className={`micro${a.done ? ' done' : ''}`} key={a.id}>
                  <div className="mcat" style={{ background: `${cat.color}22`, color: cat.color }}>{cat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mtxt">{a.text}</div>
                    <div className="mcatname">{cat.label}{a.custom ? ' · custom' : ''}</div>
                  </div>
                  {!a.done && <span className="mxp">+{a.xp}</span>}
                  <button className="micro-check" onClick={() => actions.completeMicro(a.id)} aria-label="Complete">✓</button>
                  {!a.done && <button className="mskip" onClick={() => actions.skipMicro(a.id)} title="Skip">⊘</button>}
                </div>
              );
            })}
            {micro.length === 0 && <div className="empty"><div className="big">✅</div>All done. Hit refresh for more.</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <select className="input" style={{ width: 130, flex: 'none' }} value={customCat} onChange={(e) => setCustomCat(e.target.value)}>
              {CATEGORY_LIST.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <input className="input" value={custom} placeholder="Add your own action…" onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} maxLength={100} />
            <button className="btn primary" onClick={addCustom} disabled={!custom.trim()}>Add</button>
          </div>
        </section>

        <DailyActivity />
      </div>

      <div className="lower">
        <HabitChain
          window={chainWindow}
          getStatus={(key) => statusOf(days, key)}
          onCycle={actions.cycleChain}
          currentStreak={cs}
          longestStreak={ls}
          windowWins={windowWins}
        />
        <MetricLogs
          deepWorkMinutes={todayDay.technical.deepWorkMinutes}
          workoutDone={todayDay.physical.workoutDone}
          nutritionDone={todayDay.physical.nutritionDone}
          history={history}
          onDeepWorkDelta={actions.deepWorkDelta}
          onDeepWorkSet={actions.deepWorkSet}
          onToggleWorkout={actions.toggleWorkout}
          onToggleNutrition={actions.toggleNutrition}
        />
      </div>
    </div>
  );
}
