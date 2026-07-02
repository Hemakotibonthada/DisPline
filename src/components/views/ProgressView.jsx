import { useMemo } from 'react';
import { useStore } from '../../store/StoreContext.jsx';
import { ACHIEVEMENTS, CHALLENGES, CATEGORIES, MILESTONES } from '../../store/defaults.js';
import { activityHeatmap, categoryBreakdown, localLeaderboard } from '../../store/selectors.js';

const heatClass = (count) => {
  if (count >= 4) return 'h4';
  if (count >= 3) return 'h3';
  if (count >= 2) return 'h2';
  if (count >= 1) return 'h1';
  return '';
};

const pct = (value, total) => `${Math.min(100, Math.max(0, total ? (value / total) * 100 : 0))}%`;

const challengeProgress = (challenge, stats, categories) => {
  if (challenge.id === 'c_focus20') return stats.focusSessions || 0;
  if (challenge.id === 'c_journal10') return stats.journals || 0;
  if (challenge.id === 'c_iron14') return stats.longestStreak || 0;
  if (Object.prototype.hasOwnProperty.call(CATEGORIES, challenge.category)) {
    return categories[challenge.category] || 0;
  }
  return stats.totalActions || 0;
};

export default function ProgressView() {
  const { state, derived, actions, user } = useStore();
  const stats = derived.stats;
  const level = derived.level;
  const categories = useMemo(() => categoryBreakdown(state), [state]);
  const heat = useMemo(() => activityHeatmap(state, 119), [state]);
  const leaderboard = useMemo(() => localLeaderboard(), [state, user.id]);

  const categoryList = Object.values(CATEGORIES);
  const maxCategory = Math.max(0, ...categoryList.map((category) => categories[category.id] || 0));
  const earnedCount = ACHIEVEMENTS.filter((a) => state.gamification.achievements?.[a.id]).length;

  return (
    <div className="view">
      <div className="vtitle">
        <h2>Progress</h2>
      </div>
      <div className="view-sub">Your compounding scoreboard.</div>

      <div className="stack">
        <section className="grid g3" aria-label="Progress summary">
          <div className="panel statcard accent">
            <div className="sc-top">⭐ Level</div>
            <div className="sc-v num">{level.level}</div>
            <div className="progress-bar" aria-label={`${level.xpIntoLevel} of ${level.xpForNext} XP to next level`}>
              <div className="progress-fill" style={{ width: pct(level.xpIntoLevel, level.xpForNext) }} />
            </div>
            <div className="sc-sub">
              <span className="num">{level.xpIntoLevel}</span>/<span className="num">{level.xpForNext}</span> XP to next
            </div>
          </div>
          <div className="panel statcard">
            <div className="sc-top">⚡ Total XP</div>
            <div className="sc-v num">{stats.xp}</div>
            <div className="sc-sub">Lifetime execution energy</div>
          </div>
          <div className="panel statcard">
            <div className="sc-top">🪙 Coins</div>
            <div className="sc-v num">{state.gamification.coins || 0}</div>
            <div className="sc-sub">Spendable discipline capital</div>
          </div>
          <div className="panel statcard accent">
            <div className="sc-top">🔥 Current Streak</div>
            <div className="sc-v num">{stats.currentStreak}</div>
            <div className="sc-sub">Days in motion</div>
          </div>
          <div className="panel statcard">
            <div className="sc-top">🏆 Longest Streak</div>
            <div className="sc-v num">{stats.longestStreak}</div>
            <div className="sc-sub">Best discipline chain</div>
          </div>
          <div className="panel statcard">
            <div className="sc-top">✅ Total Actions</div>
            <div className="sc-v num">{stats.totalActions}</div>
            <div className="sc-sub">All completed actions</div>
          </div>
        </section>

        <section className="grid g2">
          <div className="panel panel-p">
            <div className="section-h">
              <h3>Activity — last 17 weeks</h3>
              <span className="hint">oldest → newest</span>
            </div>
            <div className="heatmap" aria-label="119 day activity heatmap">
              {heat.map((cell) => (
                <div
                  key={cell.date}
                  className={`heat-cell ${heatClass(cell.count)}`.trim()}
                  title={`${cell.date}: ${cell.count} action${cell.count === 1 ? '' : 's'}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, color: 'var(--text-faint)', fontSize: 11 }}>
              <span>Less</span>
              <span className="heat-cell" />
              <span className="heat-cell h1" />
              <span className="heat-cell h2" />
              <span className="heat-cell h3" />
              <span className="heat-cell h4" />
              <span>More</span>
            </div>
          </div>

          <div className="panel panel-p">
            <div className="section-h">
              <h3>Category breakdown</h3>
              <span className="hint">completed micro-actions</span>
            </div>
            {maxCategory === 0 ? (
              <div className="empty">No category actions yet — complete one to start the chart.</div>
            ) : (
              <div className="bars" aria-label="Category breakdown bar chart">
                {categoryList.map((category) => {
                  const count = categories[category.id] || 0;
                  return (
                    <div className="bar-col" key={category.id} title={`${category.label}: ${count}`}>
                      <div className="bar-val num">{count}</div>
                      <div className="bar" style={{ height: pct(count, maxCategory), background: `linear-gradient(180deg, ${category.color}, var(--brand-2))` }} />
                      <div className="bar-lbl" aria-label={category.label}>{category.icon}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Challenges</h3>
            <span className="hint">join, execute, claim</span>
          </div>
          <div className="grid g4">
            {CHALLENGES.map((challenge) => {
              const record = state.challenges[challenge.id] || {};
              const joined = !!record.joined;
              const completed = !!record.completed;
              const progress = Math.min(challenge.target, challengeProgress(challenge, stats, categories));
              const ready = joined && progress >= challenge.target && !completed;
              return (
                <article className="panel challenge-card" key={challenge.id}>
                  <div className="ch-top">
                    <div className="ch-ic" aria-hidden="true">{challenge.icon}</div>
                    <div>
                      <div className="ch-t">{challenge.title}</div>
                      <div className="ch-d">{challenge.desc}</div>
                    </div>
                    <div className="ch-xp">+{challenge.xp} XP</div>
                  </div>

                  {joined ? (
                    <>
                      <div className="progress-bar" aria-label={`${progress} of ${challenge.target}`}>
                        <div className="progress-fill" style={{ width: pct(progress, challenge.target) }} />
                      </div>
                      <div className="ch-d">
                        <span className="num">{progress}</span>/<span className="num">{challenge.target}</span> complete
                      </div>
                    </>
                  ) : null}

                  {!joined ? (
                    <button className="btn primary block" type="button" onClick={() => actions.joinChallenge(challenge.id)}>
                      Join
                    </button>
                  ) : ready ? (
                    <button className="btn solid block" type="button" onClick={() => actions.claimChallenge(challenge)}>
                      Claim +{challenge.xp} XP
                    </button>
                  ) : completed ? (
                    <span className="chip active static">✓ Completed</span>
                  ) : (
                    <span className="chip static">In progress</span>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Achievements</h3>
            <span className="hint">
              <span className="num">{earnedCount}</span>/<span className="num">{ACHIEVEMENTS.length}</span> unlocked
            </span>
          </div>
          <div className="badge-grid">
            {ACHIEVEMENTS.map((achievement) => (
              <div
                className={`badge${state.gamification.achievements?.[achievement.id] ? ' earned' : ''}`}
                key={achievement.id}
                title={`${achievement.name}: ${achievement.desc}`}
              >
                <div className="bi" aria-hidden="true">{achievement.icon}</div>
                <div className="bn">{achievement.name}</div>
                <div className="bd">{achievement.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid g2">
          <div className="panel panel-p">
            <div className="section-h">
              <h3>Milestones</h3>
              <span className="hint">next visible targets</span>
            </div>
            <div className="stack">
              {MILESTONES.map((milestone) => {
                const current = stats[milestone.type] || 0;
                const done = current >= milestone.target;
                return (
                  <div className={`milestone${done ? ' done' : ''}`} key={milestone.id}>
                    <div className="mi" aria-hidden="true">{milestone.icon}</div>
                    <div className="mbody">
                      <div className="mn">
                        <span>{milestone.name}</span>
                        <span className="mc">
                          {current}/{milestone.target}
                        </span>
                      </div>
                      <div className="progress-bar" style={{ marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: pct(current, milestone.target) }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel panel-p">
            <div className="section-h">
              <h3>Leaderboard</h3>
              <span className="hint">this device</span>
            </div>
            {leaderboard.length === 0 ? (
              <div className="empty">No local leaderboard data yet.</div>
            ) : (
              <div className="leaderboard">
                {leaderboard.map((row, index) => {
                  const isMe = row.id === user.id;
                  return (
                    <div className={`lb-row${isMe ? ' me' : ''}`} key={row.id}>
                      <div className={`lb-rank${index < 3 ? ' top' : ''}`}>#{index + 1}</div>
                      <div className="avatar sm" style={{ background: row.avatarColor }}>
                        {(row.name || '?')[0]}
                      </div>
                      <div>
                        <div className="lb-name">
                          {row.name}{isMe ? ' (you)' : ''}
                        </div>
                        <div className="lb-meta">
                          Lv {row.level} · {row.streak}🔥
                        </div>
                      </div>
                      <div className="lb-xp">{row.xp} XP</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
