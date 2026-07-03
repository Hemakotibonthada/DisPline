import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import { CATEGORIES } from '../../store/defaults.js';
import { Donut, LineChart } from '../common/charts.jsx';

const emptyInvites = { incoming: [], outgoing: [] };

const initials = (user) => user?.name?.trim()?.[0]?.toUpperCase() || user?.username?.trim()?.[0]?.toUpperCase() || 'U';

const shortDate = (key) => {
  if (!key) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(key));
  if (match) return `${Number(match[2])}/${Number(match[3])}`;
  const date = new Date(key);
  return Number.isNaN(date.getTime()) ? String(key) : `${date.getMonth() + 1}/${date.getDate()}`;
};

const relativeTime = (value) => {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const [unit, size] = units.find(([, size]) => abs >= size) || ['second', 1];
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
};

function Avatar({ user, size = '' }) {
  return (
    <div className={`avatar ${size}`.trim()} style={{ background: user?.avatarColor || 'var(--brand)' }}>
      {initials(user)}
    </div>
  );
}

function PersonCard({ user, actions, onClick }) {
  const body = (
    <>
      <Avatar user={user} />
      <div className="pc-body">
        <div className="pc-name">{user?.name || 'Operator'}</div>
        <div className="pc-sub">@{user?.username || 'unknown'}</div>
      </div>
      {actions ? <div className="pc-actions">{actions}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="person-card clickable"
        style={{ width: '100%', textAlign: 'left', color: 'inherit' }}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return <article className="person-card">{body}</article>;
}

function SmallMessage({ type = 'hint', children }) {
  if (!children) return null;
  const color = type === 'error' ? 'var(--red-bright)' : type === 'success' ? 'var(--brand)' : 'var(--text-faint)';
  return <div style={{ color, fontSize: 12, fontWeight: 700 }}>{children}</div>;
}

export default function SocialView() {
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [invites, setInvites] = useState(emptyInvites);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState({ friends: true, invites: true, leaderboard: true });
  const [error, setError] = useState('');

  const [inviteValue, setInviteValue] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [busyId, setBusyId] = useState('');

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState('');

  const incomingCount = invites.incoming?.length || 0;

  const loadFriends = useCallback(async () => {
    setLoading((state) => ({ ...state, friends: true }));
    try {
      setFriends(await api.friends());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((state) => ({ ...state, friends: false }));
    }
  }, []);

  const loadInvites = useCallback(async () => {
    setLoading((state) => ({ ...state, invites: true }));
    try {
      setInvites(await api.invites());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((state) => ({ ...state, invites: false }));
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLoading((state) => ({ ...state, leaderboard: true }));
    try {
      setLeaderboard(await api.leaderboard());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((state) => ({ ...state, leaderboard: false }));
    }
  }, []);

  const reload = useCallback(() => {
    setError('');
    return Promise.all([loadFriends(), loadInvites(), loadLeaderboard()]);
  }, [loadFriends, loadInvites, loadLeaderboard]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const q = query.trim();
    setSearchError('');
    if (q.length < 2) {
      setResults([]);
      setSearchLoading(false);
      return undefined;
    }

    let ignore = false;
    setSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const users = await api.searchUsers(q);
        if (!ignore) setResults(users);
      } catch (err) {
        if (!ignore) setSearchError(err.message);
      } finally {
        if (!ignore) setSearchLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!selectedFriend) return undefined;

    let ignore = false;
    setProgress(null);
    setProgressError('');
    setProgressLoading(true);
    api.friendProgress(selectedFriend.id)
      .then((data) => {
        if (!ignore) setProgress(data);
      })
      .catch((err) => {
        if (!ignore) setProgressError(err.message);
      })
      .finally(() => {
        if (!ignore) setProgressLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedFriend]);

  useEffect(() => {
    if (!selectedFriend) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedFriend(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedFriend]);

  const sendInvite = async (identifier, fromSearch = false) => {
    const clean = identifier.trim();
    if (!clean) return;

    setInviteMessage('');
    setInviteError('');
    setBusyId(fromSearch ? clean : '');
    setInviteBusy(!fromSearch);
    try {
      await api.sendInvite(clean);
      setInviteMessage('Invite sent!');
      if (!fromSearch) setInviteValue('');
      await loadInvites();
    } catch (err) {
      if (fromSearch) setSearchError(err.message);
      else setInviteError(err.message);
    } finally {
      setBusyId('');
      setInviteBusy(false);
    }
  };

  const mutateInvite = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      await action(id);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const unfriend = async () => {
    if (!selectedFriend) return;
    setBusyId(selectedFriend.id);
    setProgressError('');
    try {
      await api.unfriend(selectedFriend.id);
      setSelectedFriend(null);
      await reload();
    } catch (err) {
      setProgressError(err.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="view">
      <div className="vtitle">
        <h2>Friends</h2>
      </div>
      <div className="view-sub">Invite people by email or username and track their progress.</div>

      {error ? <div className="auth-error">{error}</div> : null}

      <div className="social-tabs" role="tablist" aria-label="Social sections">
        {[
          ['friends', 'Friends'],
          ['invites', 'Invites'],
          ['find', 'Find people'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`social-tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'invites' && incomingCount > 0 ? <span className="tab-badge">{incomingCount}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'find' ? (
        <FindPeople
          inviteValue={inviteValue}
          setInviteValue={setInviteValue}
          inviteBusy={inviteBusy}
          inviteMessage={inviteMessage}
          inviteError={inviteError}
          onInvite={(event) => {
            event.preventDefault();
            sendInvite(inviteValue);
          }}
          query={query}
          setQuery={setQuery}
          results={results}
          searchLoading={searchLoading}
          searchError={searchError}
          busyId={busyId}
          onSearchInvite={(user) => sendInvite(user.username, true)}
        />
      ) : null}

      {tab === 'invites' ? (
        <InvitesTab
          invites={invites}
          loading={loading.invites}
          busyId={busyId}
          onAccept={(id) => mutateInvite(id, api.acceptInvite)}
          onDecline={(id) => mutateInvite(id, api.declineInvite)}
          onCancel={(id) => mutateInvite(id, api.cancelInvite)}
        />
      ) : null}

      {tab === 'friends' ? (
        <FriendsTab
          friends={friends}
          friendsLoading={loading.friends}
          leaderboard={leaderboard}
          leaderboardLoading={loading.leaderboard}
          onSelect={setSelectedFriend}
        />
      ) : null}

      {selectedFriend ? (
        <ProgressModal
          friend={selectedFriend}
          progress={progress}
          loading={progressLoading}
          error={progressError}
          busy={busyId === selectedFriend.id}
          onClose={() => setSelectedFriend(null)}
          onUnfriend={unfriend}
        />
      ) : null}
    </div>
  );
}

function FindPeople({
  inviteValue,
  setInviteValue,
  inviteBusy,
  inviteMessage,
  inviteError,
  onInvite,
  query,
  setQuery,
  results,
  searchLoading,
  searchError,
  busyId,
  onSearchInvite,
}) {
  return (
    <div className="stack">
      <section className="panel panel-p">
        <div className="section-h">
          <h3>Invite directly</h3>
          <span className="hint">email or @username</span>
        </div>
        <form className="invite-form" onSubmit={onInvite}>
          <input
            className="input"
            value={inviteValue}
            onChange={(event) => setInviteValue(event.target.value)}
            placeholder="friend@email.com or @username"
          />
          <button className="btn solid" type="submit" disabled={inviteBusy || !inviteValue.trim()}>
            {inviteBusy ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        <div style={{ marginTop: 10 }}>
          <SmallMessage type="success">{inviteMessage}</SmallMessage>
          <SmallMessage type="error">{inviteError}</SmallMessage>
        </div>
      </section>

      <section className="panel panel-p">
        <div className="section-h">
          <h3>Search people</h3>
          <span className="hint">live results</span>
        </div>
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people by name or username"
        />
        <div className="search-results">
          {searchLoading ? <div className="empty">Searching…</div> : null}
          <SmallMessage type="error">{searchError}</SmallMessage>
          {!searchLoading && query.trim().length >= 2 && results.length === 0 && !searchError ? (
            <div className="social-empty">No people found for “{query.trim()}”.</div>
          ) : null}
          {results.map((user) => (
            <PersonCard
              key={user.id}
              user={user}
              actions={(
                <button
                  className="btn sm primary"
                  type="button"
                  disabled={busyId === user.username}
                  onClick={() => onSearchInvite(user)}
                >
                  {busyId === user.username ? 'Sending…' : 'Invite'}
                </button>
              )}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function InvitesTab({ invites, loading, busyId, onAccept, onDecline, onCancel }) {
  const incoming = invites.incoming || [];
  const outgoing = invites.outgoing || [];
  const empty = !incoming.length && !outgoing.length;

  if (loading) return <div className="panel panel-p empty">Loading invites…</div>;

  return (
    <div className="stack">
      {empty ? (
        <div className="panel social-empty">
          <div className="big">📨</div>
          No pending invites
        </div>
      ) : null}

      {incoming.length ? (
        <section className="panel panel-p">
          <div className="section-h">
            <h3>Incoming</h3>
            <span className="hint">{incoming.length} pending</span>
          </div>
          <div className="stack">
            {incoming.map((invite) => (
              <PersonCard
                key={invite.id}
                user={invite.from}
                actions={(
                  <>
                    <button className="btn sm solid" type="button" disabled={busyId === invite.id} onClick={() => onAccept(invite.id)}>
                      Accept
                    </button>
                    <button className="btn sm ghost" type="button" disabled={busyId === invite.id} onClick={() => onDecline(invite.id)}>
                      Decline
                    </button>
                  </>
                )}
              />
            ))}
          </div>
        </section>
      ) : null}

      {outgoing.length ? (
        <section className="panel panel-p">
          <div className="section-h">
            <h3>Outgoing</h3>
            <span className="hint">pending acceptance</span>
          </div>
          <div className="stack">
            {outgoing.map((invite) => (
              <PersonCard
                key={invite.id}
                user={invite.to}
                actions={(
                  <button className="btn sm ghost" type="button" disabled={busyId === invite.id} onClick={() => onCancel(invite.id)}>
                    Cancel
                  </button>
                )}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function FriendsTab({ friends, friendsLoading, leaderboard, leaderboardLoading, onSelect }) {
  return (
    <div className="stack">
      <section className="panel panel-p">
        <div className="section-h">
          <h3>Your friends</h3>
          <span className="hint">{friends.length} connected</span>
        </div>
        {friendsLoading ? (
          <div className="empty">Loading friends…</div>
        ) : friends.length === 0 ? (
          <div className="social-empty">
            <div className="big">🤝</div>
            No friends yet — invite someone from Find people
          </div>
        ) : (
          <div className="grid g2">
            {friends.map((friend) => (
              <PersonCard key={friend.id} user={friend} onClick={() => onSelect(friend)} />
            ))}
          </div>
        )}
      </section>

      <section className="panel panel-p">
        <div className="section-h">
          <h3>Leaderboard</h3>
          <span className="hint">ranked by XP</span>
        </div>
        {leaderboardLoading ? (
          <div className="empty">Loading leaderboard…</div>
        ) : leaderboard.length === 0 ? (
          <div className="empty">No leaderboard data yet.</div>
        ) : (
          <div className="leaderboard">
            {leaderboard.map((row, index) => (
              <div className={`lb-row${row.isMe ? ' me' : ''}`} key={row.id}>
                <div className={`lb-rank${index < 3 ? ' top' : ''}`}>#{index + 1}</div>
                <Avatar user={row} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div className="lb-name">
                    {row.name}
                    {row.isMe ? ' (you)' : ''}
                  </div>
                  <div className="lb-meta">Lv {row.level} · {row.streak}🔥 · {row.actions} actions</div>
                </div>
                <div className="lb-xp">{row.xp} XP</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProgressModal({ friend, progress, loading, error, busy, onClose, onUnfriend }) {
  const summary = progress?.summary || {};
  const trends = progress?.trends || [];
  const categories = progress?.categories || {};

  const labels = trends.map((trend) => shortDate(trend.date));
  const actionMax = Math.max(1, ...trends.map((trend) => trend.actions || 0));
  const categorySegments = useMemo(() => (
    Object.entries(categories)
      .map(([id, value]) => ({
        label: CATEGORIES[id]?.label || id,
        value,
        color: CATEGORIES[id]?.color || 'var(--brand)',
      }))
      .filter((segment) => segment.value > 0)
  ), [categories]);
  const categoryTotal = categorySegments.reduce((total, segment) => total + segment.value, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="modal panel" style={{ maxWidth: 760 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>Friend progress</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close progress modal">
            ×
          </button>
        </div>

        {loading ? <div className="empty">Loading progress…</div> : null}
        {error ? <div className="auth-error">{error}</div> : null}

        {!loading && progress ? (
          <div className="friend-progress">
            <div className="fp-hero">
              <Avatar user={progress.user || friend} size="lg" />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{progress.user?.name || friend.name}</div>
                <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>@{progress.user?.username || friend.username}</div>
                <span className="chip active static" style={{ marginTop: 8 }}>Level {summary.level || 0}</span>
              </div>
            </div>

            <div className="fp-stat-grid">
              <div className="panel statcard accent">
                <div className="sc-top">🔥 Current</div>
                <div className="sc-v num">{summary.currentStreak || 0}</div>
                <div className="sc-sub">day streak</div>
              </div>
              <div className="panel statcard">
                <div className="sc-top">🏆 Longest</div>
                <div className="sc-v num">{summary.longestStreak || 0}</div>
                <div className="sc-sub">best chain</div>
              </div>
              <div className="panel statcard accent">
                <div className="sc-top">⚡ Total XP</div>
                <div className="sc-v num">{summary.xp || 0}</div>
                <div className="sc-sub">{summary.coins || 0} coins</div>
              </div>
              <div className="panel statcard">
                <div className="sc-top">✅ Actions</div>
                <div className="sc-v num">{summary.totalActions || 0}</div>
                <div className="sc-sub">{summary.focusMinutes || 0} focus min</div>
              </div>
            </div>

            {trends.length ? (
              <div className="grid g2">
                <div className="panel panel-p">
                  <div className="section-h">
                    <h3>Discipline trend</h3>
                    <span className="hint">0–100%</span>
                  </div>
                  <LineChart
                    series={[{ name: 'Discipline %', color: '#34d399', values: trends.map((trend) => trend.discipline || 0), area: true }]}
                    max={100}
                    height={180}
                    labels={labels}
                    unit="%"
                  />
                </div>
                <div className="panel panel-p">
                  <div className="section-h">
                    <h3>Actions / day</h3>
                    <span className="hint">max {actionMax}</span>
                  </div>
                  <LineChart
                    series={[{ name: 'Actions', color: '#60a5fa', values: trends.map((trend) => trend.actions || 0), area: true }]}
                    max={actionMax}
                    height={145}
                    labels={labels}
                  />
                </div>
              </div>
            ) : (
              <div className="panel social-empty">No activity data yet.</div>
            )}

            {categorySegments.length ? (
              <div className="panel panel-p">
                <div className="section-h">
                  <h3>Category mix</h3>
                  <span className="hint">completed actions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                  <Donut segments={categorySegments} size={150} centerValue={categoryTotal} centerLabel="actions" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categorySegments.map((segment) => (
                      <span className="chip static" key={segment.label}>
                        <i style={{ width: 8, height: 8, borderRadius: 999, background: segment.color }} />
                        {segment.label}
                        <span className="num">{segment.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div className="fp-updated">Updated {relativeTime(progress.updatedAt)}</div>
              <button className="btn sm danger" type="button" disabled={busy} onClick={onUnfriend}>
                {busy ? 'Removing…' : 'Unfriend'}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
