import { useEffect, useMemo, useState } from 'react';
import { formatShortDate, lastNDays, shortWeekday, todayKey } from '../../lib/dateUtils.js';
import { useStore } from '../../store/storeContext.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const avg = (items) => {
  const nums = items.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((sum, n) => sum + n, 0) / nums.length : 0;
};

const moodLabel = (value) => (value >= 8 ? 'High' : value >= 6 ? 'Steady' : value >= 4 ? 'Low' : 'Heavy');

const relativeTime = (iso) => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'recently';
  const minutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function WellnessView() {
  const { state, actions } = useStore();
  const today = todayKey();
  const week = useMemo(() => lastNDays(7), []);
  const todaySleep = state.sleep?.[today] || {};

  const waterGoal = clamp(Number(state.waterGoal) || 8, 1, 20);
  const todayGlasses = Number(state.water?.[today]) || 0;

  const [sleepHours, setSleepHours] = useState(todaySleep.hours ?? '');
  const [sleepQuality, setSleepQuality] = useState(Number(todaySleep.quality) || 5);
  const [bedtime, setBedtime] = useState(todaySleep.bedtime || '');
  const [wake, setWake] = useState(todaySleep.wake || '');
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [note, setNote] = useState('');

  useEffect(() => {
    setSleepHours(todaySleep.hours ?? '');
    setSleepQuality(Number(todaySleep.quality) || 5);
    setBedtime(todaySleep.bedtime || '');
    setWake(todaySleep.wake || '');
  }, [todaySleep.hours, todaySleep.quality, todaySleep.bedtime, todaySleep.wake]);

  const sleepEntries = useMemo(
    () => Object.entries(state.sleep || {}).filter(([, item]) => item && (item.hours || item.quality)),
    [state.sleep],
  );
  const moodEntries = state.mood || [];
  const maxWater = Math.max(waterGoal, ...week.map((key) => Number(state.water?.[key]) || 0), 1);
  const avgHours = avg(sleepEntries.map(([, item]) => item.hours));
  const avgQuality = avg(sleepEntries.map(([, item]) => item.quality));
  const avgMood = avg(moodEntries.map((item) => item.mood));
  const avgEnergy = avg(moodEntries.map((item) => item.energy));
  const avgStress = avg(moodEntries.map((item) => item.stress));

  const setWaterTo = (target) => {
    actions.addWater(target - todayGlasses);
  };

  const saveSleep = (event) => {
    event.preventDefault();
    actions.setSleep(today, {
      hours: clamp(Number(sleepHours) || 0, 0, 24),
      quality: clamp(Number(sleepQuality) || 5, 1, 10),
      bedtime: bedtime.trim(),
      wake: wake.trim(),
    });
  };

  const logMood = (event) => {
    event.preventDefault();
    actions.addMood({
      mood: Number(mood),
      energy: Number(energy),
      stress: Number(stress),
      note: note.trim(),
    });
    setNote('');
  };

  return (
    <div className="view">
      <div className="vtitle">
        <h2>Wellness</h2>
      </div>
      <div className="view-sub">Track the body. The mind follows.</div>

      <div className="grid g3" style={{ alignItems: 'start' }}>
        <section className="panel panel-p">
          <div className="section-h">
            <h3>Water</h3>
            <span className="hint">
              <span className="num">{todayGlasses}</span> / <span className="num">{waterGoal}</span> glasses
            </span>
          </div>

          <div className="water-row" aria-label="Water glasses today">
            {Array.from({ length: waterGoal }, (_, i) => {
              const target = i + 1;
              return (
                <button
                  type="button"
                  key={target}
                  className={`glass${target <= todayGlasses ? ' full' : ''}`}
                  aria-label={`Set water to ${target} glasses`}
                  title={`${target} glass${target === 1 ? '' : 'es'}`}
                  onClick={() => setWaterTo(target)}
                />
              );
            })}
          </div>

          <div className="grid g2 keep2" style={{ gap: 10, marginBottom: 16 }}>
            <button type="button" className="btn solid" onClick={() => actions.addWater(1)}>
              +1 glass
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sm icon" onClick={() => actions.setWaterGoal(waterGoal - 1)}>
                −
              </button>
              <div className="panel statcard" style={{ flex: 1, padding: '8px 10px', textAlign: 'center' }}>
                <div className="sc-top" style={{ justifyContent: 'center' }}>Goal</div>
                <div className="sc-v" style={{ fontSize: 18 }}>{waterGoal}</div>
              </div>
              <button type="button" className="btn sm icon" onClick={() => actions.setWaterGoal(waterGoal + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="section-h" style={{ marginTop: 4 }}>
            <h3>7-day hydration</h3>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, alignItems: 'end' }}>
            {week.map((key) => {
              const glasses = Number(state.water?.[key]) || 0;
              return (
                <div key={key} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
                  <div
                    title={`${formatShortDate(key)} · ${glasses} glasses`}
                    style={{
                      width: '100%',
                      minHeight: 8,
                      height: `${Math.max(8, (glasses / maxWater) * 58)}px`,
                      borderRadius: 8,
                      background: glasses ? 'linear-gradient(180deg, #38bdf8, #0ea5e9)' : 'var(--surface-3)',
                      border: '1px solid var(--line)',
                    }}
                  />
                  <span className="num" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{glasses}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-ghost)' }}>{shortWeekday(key)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Sleep</h3>
            <span className="hint">Last night · {formatShortDate(today)}</span>
          </div>

          <form onSubmit={saveSleep}>
            <div className="field">
              <label htmlFor="sleep-hours">Hours</label>
              <input
                id="sleep-hours"
                className="input num"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepHours}
                onChange={(event) => setSleepHours(event.target.value)}
                placeholder="7.5"
              />
            </div>
            <div className="field">
              <label htmlFor="sleep-quality">Quality</label>
              <div className="slider-row">
                <input
                  id="sleep-quality"
                  type="range"
                  min="1"
                  max="10"
                  value={sleepQuality}
                  onChange={(event) => setSleepQuality(event.target.value)}
                />
                <span className="sv">{sleepQuality}</span>
              </div>
            </div>
            <div className="grid g2 keep2" style={{ gap: 10 }}>
              <div className="field">
                <label htmlFor="bedtime">Bedtime</label>
                <input id="bedtime" className="input num" value={bedtime} onChange={(event) => setBedtime(event.target.value)} placeholder="10:30 PM" />
              </div>
              <div className="field">
                <label htmlFor="wake">Wake</label>
                <input id="wake" className="input num" value={wake} onChange={(event) => setWake(event.target.value)} placeholder="6:30 AM" />
              </div>
            </div>
            <button type="submit" className="btn primary block">Save sleep</button>
          </form>

          <div className="grid g2 keep2" style={{ gap: 10, margin: '16px 0' }}>
            <div className="panel statcard accent">
              <div className="sc-top">Avg hours</div>
              <div className="sc-v">{avgHours ? avgHours.toFixed(1) : '—'}<small> h</small></div>
              <div className="sc-sub">{sleepEntries.length} recorded nights</div>
            </div>
            <div className="panel statcard">
              <div className="sc-top">Avg quality</div>
              <div className="sc-v">{avgQuality ? avgQuality.toFixed(1) : '—'}<small> /10</small></div>
              <div className="sc-sub">Recovery signal</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {week.map((key) => {
              const item = state.sleep?.[key];
              return (
                <div key={key} className="panel" style={{ padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ minWidth: 52 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>{shortWeekday(key)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-ghost)' }}>{formatShortDate(key)}</div>
                  </div>
                  {item ? (
                    <>
                      <span className="num" style={{ fontWeight: 800 }}>{Number(item.hours || 0).toFixed(1)}h</span>
                      <span className="num" style={{ color: 'var(--brand)', marginLeft: 'auto' }}>Q{item.quality || '—'}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-ghost)', fontSize: 12, marginLeft: 'auto' }}>No log</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Mood</h3>
            <span className="hint">Mind telemetry</span>
          </div>

          <form onSubmit={logMood}>
            {[
              ['Mood', mood, setMood],
              ['Energy', energy, setEnergy],
              ['Stress', stress, setStress],
            ].map(([label, value, setter]) => (
              <div className="field" key={label}>
                <label htmlFor={`mood-${label.toLowerCase()}`}>{label}</label>
                <div className="slider-row">
                  <input
                    id={`mood-${label.toLowerCase()}`}
                    type="range"
                    min="1"
                    max="10"
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                  />
                  <span className="sv">{value}</span>
                </div>
              </div>
            ))}
            <div className="field">
              <label htmlFor="mood-note">Note</label>
              <input
                id="mood-note"
                className="input"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional context"
              />
            </div>
            <button type="submit" className="btn solid block">Log mood</button>
          </form>

          <div className="grid g3 keep2" style={{ gap: 10, margin: '16px 0' }}>
            <div className="panel statcard accent">
              <div className="sc-top">Mood</div>
              <div className="sc-v">{avgMood ? avgMood.toFixed(1) : '—'}</div>
              <div className="sc-sub">{avgMood ? moodLabel(avgMood) : 'No data yet'}</div>
            </div>
            <div className="panel statcard">
              <div className="sc-top">Energy</div>
              <div className="sc-v">{avgEnergy ? avgEnergy.toFixed(1) : '—'}</div>
              <div className="sc-sub">Fuel level</div>
            </div>
            <div className="panel statcard">
              <div className="sc-top">Stress</div>
              <div className="sc-v">{avgStress ? avgStress.toFixed(1) : '—'}</div>
              <div className="sc-sub">Lower is lighter</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {moodEntries.slice(0, 5).length ? (
              moodEntries.slice(0, 5).map((item) => (
                <div key={item.id} className="panel" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="num" style={{ color: 'var(--brand)', fontWeight: 800 }}>M{item.mood}</span>
                    <span className="num">E{item.energy}</span>
                    <span className="num" style={{ color: 'var(--amber-bright)' }}>S{item.stress}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-faint)' }}>{relativeTime(item.at)}</span>
                  </div>
                  {item.note ? <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.note}</div> : null}
                </div>
              ))
            ) : (
              <div className="empty">
                <div className="big">◌</div>
                Log your first mood check-in.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
