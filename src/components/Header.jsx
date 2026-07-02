import DisciplineGauge from './DisciplineGauge.jsx';

function nmtView(nmt) {
  if (nmt.brokeToday) {
    return {
      cls: 'is-broken',
      icon: '✕',
      title: 'Chain Broken Today',
      sub: 'It happens. Reset tomorrow — just never miss twice.',
    };
  }
  if (nmt.atRisk) {
    return {
      cls: 'is-risk',
      icon: '⚠',
      title: 'Never Miss Twice',
      sub: 'You missed yesterday. Today is non-negotiable — win it back.',
    };
  }
  if (nmt.todaySecured) {
    return {
      cls: 'is-safe secured',
      icon: '✓',
      title: 'Locked In Today',
      sub: 'Discipline held. The chain grows by one.',
    };
  }
  return {
    cls: 'is-safe',
    icon: '🛡',
    title: 'Chain Intact',
    sub: 'One miss is human. Two is a pattern. Never miss twice.',
  };
}

export default function Header({ dateLabel, score, scoreCaption, nmt, currentStreak, longestStreak }) {
  const v = nmtView(nmt);

  return (
    <header className="card header enter">
      <div className="brand">
        <span className="kicker">
          <span className="spark" /> The Daily Execution System
        </span>
        <h1>
          Execute today. <span className="accent">Don&apos;t break the chain.</span>
        </h1>
        <div className="date mono">{dateLabel}</div>
        <div className="creed">
          <span className="creed-chip"><b>Ruthless</b> Focus</span>
          <span className="creed-chip"><b>Unforgiving</b> Consistency</span>
          <span className="creed-chip"><b>Minimalist</b> Metrics</span>
        </div>
      </div>

      <DisciplineGauge score={score} caption={scoreCaption} />

      <div className="header-right">
        <div className={`nmt ${v.cls}`} role="status" aria-live="polite">
          <div className="icon">{v.icon}</div>
          <div className="body">
            <div className="title">{v.title}</div>
            <div className="sub">{v.sub}</div>
          </div>
        </div>
        <div className="streak-pills">
          <div className="streak-pill hot">
            <span className="n mono">
              {currentStreak}
              <span className="fire"> 🔥</span>
            </span>
            <span className="l">Day Streak</span>
          </div>
          <div className="streak-pill best">
            <span className="n mono">{longestStreak}</span>
            <span className="l">Longest Ever</span>
          </div>
        </div>
      </div>
    </header>
  );
}
