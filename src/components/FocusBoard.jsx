import Pillar from './Pillar.jsx';
import { PILLARS } from '../lib/discipline.js';
import { formatDuration } from '../lib/format.js';

/**
 * The Rule of 2 board: two isolated pillars, one non-negotiable each.
 * Technical growth is kept visually separate from physical health.
 */
export default function FocusBoard({ tech, phys, timers, onSetGoal, onToggleDone, onClearGoal, onTimerChange }) {
  const lockedCount = (tech.goalDone ? 1 : 0) + (phys.goalDone ? 1 : 0);

  return (
    <section className="card enter d1" style={{ padding: 'clamp(18px, 2.2vw, 24px)' }}>
      <div className="board-head">
        <div className="board-title">
          <h2>Deep Focus Board</h2>
          <span className="r2">RULE OF 2</span>
        </div>
        <div className="board-sub">
          Exactly one non-negotiable per pillar · <b className="mono">{lockedCount}/2</b> secured today
        </div>
      </div>

      <div className="pillars" style={{ marginTop: 16 }}>
        <Pillar
          config={PILLARS.technical}
          glyph="💻"
          goal={tech.goal}
          goalDone={tech.goalDone}
          timerState={timers.technical}
          summaryItems={[
            {
              icon: '⏱',
              label: 'Deep Work Logged',
              value: formatDuration(tech.deepWorkMinutes),
              on: tech.deepWorkMinutes > 0,
            },
          ]}
          onSetGoal={(t) => onSetGoal('technical', t)}
          onToggleDone={() => onToggleDone('technical')}
          onClearGoal={() => onClearGoal('technical')}
          onTimerChange={(next) => onTimerChange('technical', next)}
        />

        <Pillar
          config={PILLARS.physical}
          glyph="💪"
          goal={phys.goal}
          goalDone={phys.goalDone}
          timerState={timers.physical}
          summaryItems={[
            { icon: '🏋', label: 'Workout', value: phys.workoutDone ? 'Complete' : '—', on: phys.workoutDone },
            { icon: '🍗', label: 'Protein Target', value: phys.nutritionDone ? 'Met' : '—', on: phys.nutritionDone },
          ]}
          onSetGoal={(t) => onSetGoal('physical', t)}
          onToggleDone={() => onToggleDone('physical')}
          onClearGoal={() => onClearGoal('physical')}
          onTimerChange={(next) => onTimerChange('physical', next)}
        />
      </div>
    </section>
  );
}
