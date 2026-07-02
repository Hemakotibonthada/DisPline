import { useMemo, useState } from 'react';
import { useStore } from '../../store/StoreContext.jsx';
import { CATEGORIES, CATEGORY_LIST, HABIT_TEMPLATES } from '../../store/defaults.js';
import { addDays, lastNDays, shortWeekday, todayKey } from '../../lib/dateUtils.js';

const COLOR_PRESETS = ['#34d399', '#38bdf8', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171'];

const emptyForm = {
  name: '',
  icon: '⚡',
  color: '#34d399',
  category: 'health',
  cue: '',
  routine: '',
  reward: '',
};

function habitStreak(logs = {}) {
  let streak = 0;
  let cursor = todayKey();
  if (!logs[cursor]) cursor = addDays(cursor, -1);
  while (logs[cursor]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function HabitModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({ ...emptyForm, ...initial }));

  const update = (field, value) => setForm((cur) => ({ ...cur, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    onSave({
      name,
      icon: form.icon.trim() || '⚡',
      color: form.color || CATEGORIES[form.category]?.color || '#34d399',
      category: form.category || 'health',
      cue: form.cue.trim(),
      routine: form.routine.trim(),
      reward: form.reward.trim(),
    });
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <form className="modal panel" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{mode === 'edit' ? 'Edit Habit' : 'New Habit'}</h3>
          <button className="modal-close" type="button" aria-label="Close habit form" onClick={onClose}>×</button>
        </div>

        <div className="grid g2">
          <div className="field">
            <label htmlFor="habit-name">Name</label>
            <input
              id="habit-name"
              className="input"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Read one page"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="habit-icon">Icon</label>
            <input
              id="habit-icon"
              className="input"
              value={form.icon}
              onChange={(event) => update('icon', event.target.value)}
              placeholder="⚡"
            />
          </div>
        </div>

        <div className="field">
          <label>Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className={`chip ${form.color === color ? 'active' : ''}`}
                onClick={() => update('color', color)}
                aria-label={`Use color ${color}`}
                style={{ minWidth: 42, justifyContent: 'center' }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: color,
                    boxShadow: `0 0 14px ${color}66`,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="habit-category">Category</label>
          <select
            id="habit-category"
            className="input"
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
          >
            {CATEGORY_LIST.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="habit-cue">Cue</label>
          <input
            id="habit-cue"
            className="input"
            value={form.cue}
            onChange={(event) => update('cue', event.target.value)}
            placeholder="After coffee"
          />
        </div>

        <div className="field">
          <label htmlFor="habit-routine">Routine</label>
          <textarea
            id="habit-routine"
            className="input"
            value={form.routine}
            onChange={(event) => update('routine', event.target.value)}
            placeholder="Breathe for 2 minutes"
          />
        </div>

        <div className="field">
          <label htmlFor="habit-reward">Reward</label>
          <input
            id="habit-reward"
            className="input"
            value={form.reward}
            onChange={(event) => update('reward', event.target.value)}
            placeholder="Calm mind"
          />
        </div>

        <button className="btn solid block" type="submit">
          {mode === 'edit' ? 'Save changes' : 'Create habit'}
        </button>
      </form>
    </div>
  );
}

function HabitCard({ habit, weekDays, today, onToggle, onEdit, onDelete }) {
  const logs = habit.logs || {};
  const doneToday = Boolean(logs[today]);
  const category = CATEGORIES[habit.category];

  return (
    <article className="habit-card panel" style={{ '--hc': habit.color || category?.color || '#34d399' }}>
      <div className="habit-top">
        <div className="habit-ic" aria-hidden="true">{habit.icon || category?.icon || '⚡'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="habit-name">{habit.name}</div>
          <div className="habit-crr">
            <b>Cue:</b> {habit.cue || 'Set a trigger'} · <b>Do:</b> {habit.routine || 'Define the action'}
            {habit.reward ? <> · <b>Reward:</b> {habit.reward}</> : null}
          </div>
        </div>
        <div className="habit-streak num" title="Current streak">
          {habitStreak(logs)}🔥
        </div>
      </div>

      <div className="habit-week" aria-label={`${habit.name} last 7 days`}>
        {weekDays.map((day) => (
          <div key={day} className={`hd ${logs[day] ? 'on' : ''}`} title={day}>
            {shortWeekday(day).slice(0, 1)}
          </div>
        ))}
      </div>

      <div className="habit-actions">
        <button
          type="button"
          className={`habit-done-btn btn block ${doneToday ? 'done' : ''}`}
          onClick={() => onToggle(habit.id)}
        >
          {doneToday ? '✓ Done today' : 'Mark done'}
        </button>
        <button className="btn icon ghost" type="button" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)}>
          ✎
        </button>
        <button className="btn icon ghost" type="button" aria-label={`Delete ${habit.name}`} onClick={() => onDelete(habit)}>
          🗑
        </button>
      </div>
    </article>
  );
}

export default function HabitsView() {
  const { state, actions } = useStore();
  const [modal, setModal] = useState(null);
  const today = todayKey();
  const weekDays = useMemo(() => lastNDays(7), []);

  const openCreate = () => setModal({ mode: 'create', habit: null });
  const openEdit = (habit) => setModal({ mode: 'edit', habit });
  const closeModal = () => setModal(null);

  const handleSave = (payload) => {
    if (modal?.mode === 'edit') {
      actions.editHabit(modal.habit.id, payload);
    } else {
      actions.addHabit(payload);
    }
    closeModal();
  };

  const handleDelete = (habit) => {
    if (window.confirm(`Delete "${habit.name}"? This keeps your system clean but removes its log history.`)) {
      actions.deleteHabit(habit.id);
    }
  };

  return (
    <div className="view">
      <div className="vtitle">
        <h2>Habits</h2>
      </div>
      <p className="view-sub">Build atomic habits — cue, routine, reward. Consistency compounds.</p>

      <div className="panel panel-p stack">
        <div className="section-h">
          <h3>Atomic starters</h3>
          <button className="btn primary" type="button" onClick={openCreate}>+ New Habit</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HABIT_TEMPLATES.map((template) => (
            <button
              key={`${template.name}-${template.category}`}
              className="chip"
              type="button"
              onClick={() => actions.addHabit(template)}
              style={{ borderColor: `${template.color}55` }}
            >
              <span aria-hidden="true">{template.icon}</span> {template.name}
            </button>
          ))}
        </div>
      </div>

      {!state.habits.length ? (
        <div className="empty panel">
          <div className="big">🌱</div>
          No habits yet — add one or pick a template
        </div>
      ) : (
        <div className="grid g3" style={{ marginTop: 18 }}>
          {state.habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              weekDays={weekDays}
              today={today}
              onToggle={actions.toggleHabitToday}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal ? (
        <HabitModal
          mode={modal.mode}
          initial={modal.habit || emptyForm}
          onClose={closeModal}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
