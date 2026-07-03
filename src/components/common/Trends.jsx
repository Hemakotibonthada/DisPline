import { useStore } from '../../store/StoreContext.jsx';
import { dailyTrends } from '../../store/selectors.js';
import { keyToDate } from '../../lib/dateUtils.js';

const W = 320;
const H = 64;

function linePath(vals, max) {
  const pts = vals.map((v, i) => [(i / Math.max(vals.length - 1, 1)) * W, H - (Math.min(v, max) / max) * H]);
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
}
function areaPath(vals, max) {
  return `${linePath(vals, max)} L${W} ${H} L0 ${H} Z`;
}

export default function Trends() {
  const { state } = useStore();
  const trends = dailyTrends(state, 14);
  const disc = trends.map((t) => t.discipline);
  const acts = trends.map((t) => t.actions);
  const avgDisc = Math.round(disc.reduce((s, v) => s + v, 0) / disc.length);
  const totalActs = acts.reduce((s, v) => s + v, 0);
  const maxAct = Math.max(1, ...acts);
  const moodPts = trends.filter((t) => t.mood != null);

  return (
    <section className="panel panel-p">
      <div className="section-h">
        <h3>📈 14-Day Trends</h3>
        <span className="hint">avg discipline <b className="num" style={{ color: 'var(--brand)' }}>{avgDisc}%</b> · <b className="num">{totalActs}</b> actions</span>
      </div>

      <div className="grid g2">
        <div className="trend-card">
          <div className="trend-lbl">Discipline %</div>
          <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="discfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--brand)" stopOpacity="0.35" />
                <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath(disc, 100)} fill="url(#discfill)" />
            <path d={linePath(disc, 100)} fill="none" stroke="var(--brand)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="trend-card">
          <div className="trend-lbl">Actions / day</div>
          <div className="trend-bars">
            {trends.map((t) => (
              <div className="tb-col" key={t.date} title={`${t.actions} on ${t.date}`}>
                <div className="tb" style={{ height: `${(t.actions / maxAct) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {moodPts.length > 1 && (
        <div className="trend-card" style={{ marginTop: 12 }}>
          <div className="trend-lbl">Mood trend (1–10)</div>
          <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <path d={linePath(trends.map((t) => t.mood ?? 5), 10)} fill="none" stroke="#a78bfa" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}
      <div className="trend-axis">
        <span>{trends.length ? shortD(trends[0].date) : ''}</span>
        <span>today</span>
      </div>
    </section>
  );
}

function shortD(key) {
  const d = keyToDate(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
