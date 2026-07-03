import { useStore } from '../../store/StoreContext.jsx';
import { categoryBreakdown, dailyTrends } from '../../store/selectors.js';
import { CATEGORIES } from '../../store/defaults.js';
import { keyToDate } from '../../lib/dateUtils.js';
import { Donut, LineChart } from './charts.jsx';

function md(key) {
  const d = keyToDate(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Trends() {
  const { state } = useStore();
  const trends = dailyTrends(state, 30);
  const disc = trends.map((t) => t.discipline);
  const acts = trends.map((t) => t.actions);
  const labels = trends.map((t) => md(t.date));
  const avg = Math.round(disc.reduce((s, v) => s + v, 0) / Math.max(disc.length, 1));
  const totalActs = acts.reduce((s, v) => s + v, 0);

  const cats = categoryBreakdown(state);
  const segments = Object.entries(cats)
    .map(([k, v]) => ({ label: CATEGORIES[k]?.label || k, value: v, color: CATEGORIES[k]?.color || '#7b8794' }))
    .sort((a, b) => b.value - a.value);
  const totalCat = segments.reduce((s, x) => s + x.value, 0);

  return (
    <section className="panel panel-p">
      <div className="section-h">
        <h3>📈 30-Day Trends</h3>
        <span className="hint">avg discipline <b className="num" style={{ color: 'var(--brand)' }}>{avg}%</b> · <b className="num">{totalActs}</b> actions</span>
      </div>

      <div className="grid g2">
        <div className="trend-card">
          <div className="trend-lbl">Discipline %</div>
          <LineChart series={[{ name: 'Discipline', color: '#4285f4', values: disc, area: true }]} max={100} height={150} labels={labels} unit="%" />
        </div>
        <div className="trend-card">
          <div className="trend-lbl">Actions / day</div>
          <LineChart series={[{ name: 'Actions', color: '#34a853', values: acts, area: true }]} height={150} labels={labels} />
        </div>
      </div>

      {segments.length > 0 && (
        <div className="grid g2" style={{ marginTop: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Donut segments={segments} size={160} centerValue={totalCat} centerLabel="actions" />
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <div className="trend-lbl">Category mix</div>
            {segments.map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <i style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flex: 'none' }} />
                <span style={{ flex: 1 }}>{s.label}</span>
                <b className="num">{s.value}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
