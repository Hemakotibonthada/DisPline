import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/StoreContext.jsx';
import CommandPalette from '../common/CommandPalette.jsx';
import Confetti from '../common/Confetti.jsx';
import Avatar from '../common/Avatar.jsx';
import { useInstallPrompt } from '../../lib/useInstallPrompt.js';
import { playLevelUp, playPop } from '../../lib/sfx.js';
import TodayView from '../views/TodayView.jsx';
import HabitsView from '../views/HabitsView.jsx';
import FocusView from '../views/FocusView.jsx';
import JournalView from '../views/JournalView.jsx';
import WellnessView from '../views/WellnessView.jsx';
import ProgressView from '../views/ProgressView.jsx';
import ProfileView from '../views/ProfileView.jsx';
import SocialView from '../views/SocialView.jsx';

const NAV = [
  { id: 'today', label: 'Today', icon: '◎' },
  { id: 'habits', label: 'Habits', icon: '🔁' },
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'journal', label: 'Journal', icon: '📝' },
  { id: 'wellness', label: 'Wellness', icon: '🌿' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'social', label: 'Friends', icon: '🤝' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];
const BOTTOM = NAV.filter((n) => n.id !== 'profile');

const VIEWS = {
  today: TodayView,
  habits: HabitsView,
  focus: FocusView,
  journal: JournalView,
  wellness: WellnessView,
  progress: ProgressView,
  social: SocialView,
  profile: ProfileView,
};

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const NOTIF_ICON = { level: '⭐', achievement: '🏅', streak: '🔥', challenge: '🎯' };

export default function AppShell() {
  const { state, actions, derived, toasts, user } = useStore();
  const [view, setView] = useState('today');
  const [notifOpen, setNotifOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confettiN, setConfettiN] = useState(0);
  const seenToasts = useRef(new Set());
  const { canInstall, promptInstall } = useInstallPrompt();

  const level = derived.level;
  const unread = state.notifications.filter((n) => !n.read).length;
  const navItems = user.isGuest ? NAV.filter((n) => n.id !== 'social') : NAV;
  const bottomItems = user.isGuest ? BOTTOM.filter((n) => n.id !== 'social') : BOTTOM;
  const showGuestSocial = view === 'social' && user.isGuest;
  const ActiveView = VIEWS[view] || TodayView;

  useEffect(() => { setNotifOpen(false); }, [view]);

  // Global keyboard: Cmd/Ctrl+K toggles the command palette; 1–7 switch views.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= NAV.length) {
        setView(NAV[idx - 1].id);
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Celebrate level-ups / achievements with confetti + optional sound.
  useEffect(() => {
    let celebrate = false;
    for (const t of toasts) {
      if (seenToasts.current.has(t.id)) continue;
      seenToasts.current.add(t.id);
      if (t.type === 'level' || t.type === 'achievement') { celebrate = true; playLevelUp(state.settings.sound); }
      else if (t.type === 'reward') playPop(state.settings.sound);
    }
    if (celebrate) setConfettiN((n) => n + 1);
  }, [toasts, state.settings.sound]);

  const openNotifs = () => {
    setNotifOpen((o) => !o);
    if (!notifOpen && unread) actions.markNotificationsRead();
  };

  const go = (id) => { setView(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">◆</div>
          <div className="txt">
            <b>Execution System</b>
            <span>Daily</span>
          </div>
        </div>
        <nav className="stack" style={{ gap: 4 }}>
          {navItems.map((n) => (
            <button key={n.id} className={`nav-item${view === n.id ? ' active' : ''}`} onClick={() => go(n.id)}>
              <span className="ic">{n.icon}</span>
              {n.label}
              {n.id === 'progress' && unread ? <span className="nav-badge num">{unread}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="nav-item" onClick={() => go('profile')}>
            <Avatar user={user} size={30} />
            <span style={{ minWidth: 0, overflow: 'hidden' }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{state.gamification.activeTitle}</span>
            </span>
          </button>
          <button className="btn ghost sm block" style={{ marginTop: 8 }} onClick={actions.logout}>Log out</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="mbrand">
            <span className="logo">◆</span>
            <span>Execution</span>
          </div>
          <div className="topbar-spacer" />
          <div className="tb-stats">
            <div className="stat-chip level">
              <span className="ic">⭐</span>
              <div>
                <div><span className="v num">Lv {level.level}</span></div>
                <div className="level-xpbar"><i style={{ width: `${Math.round((level.xpIntoLevel / level.xpForNext) * 100)}%` }} /></div>
              </div>
            </div>
            <div className="stat-chip coins">
              <span className="ic">🪙</span>
              <span className="v num">{state.gamification.coins}</span>
            </div>
            <div className="stat-chip streak">
              <span className="ic">🔥</span>
              <span className="v num">{derived.stats.currentStreak}</span>
            </div>
          </div>
          {canInstall && (
            <button className="install-btn" onClick={promptInstall} title="Install app">⤓ <span className="lbl">Install</span></button>
          )}
          <button className="cmdk-btn" onClick={() => setPaletteOpen(true)} title="Command palette (Ctrl/Cmd+K)">
            <span>🔍</span><span className="lbl kbd">⌘K</span>
          </button>
          <button className="notif-btn" onClick={openNotifs} aria-label="Notifications">
            🔔
            {unread ? <span className="notif-badge num">{unread}</span> : null}
          </button>
          <button onClick={() => go('profile')} aria-label="Profile" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}><Avatar user={user} size={40} /></button>

          {notifOpen && (
            <div className="notif-panel panel">
              <div className="section-h" style={{ padding: '4px 8px' }}>
                <h3 style={{ fontSize: 12 }}>Notifications</h3>
                {state.notifications.length ? <button className="btn sm ghost" onClick={actions.clearNotifications}>Clear</button> : null}
              </div>
              {state.notifications.length === 0 && <div className="empty" style={{ padding: 20 }}>No notifications yet.</div>}
              {state.notifications.slice(0, 30).map((n) => (
                <div className={`notif-row${n.read ? '' : ' unread'}`} key={n.id}>
                  <span className="nic">{NOTIF_ICON[n.type] || '•'}</span>
                  <div style={{ flex: 1 }}>
                    <div className="nm">{n.message}</div>
                    <div className="nt">{timeAgo(n.at)} ago</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        {showGuestSocial ? (
          <div className="view">
            <div className="vtitle"><h2>Friends</h2></div>
            <p className="view-sub">Invite people and track their progress across devices.</p>
            <div className="panel panel-p social-empty">
              <div className="big">🤝</div>
              <div style={{ marginBottom: 14 }}>Friends &amp; invites need a real account. Guest data stays on this device only.</div>
              <button className="btn solid" onClick={actions.logout}>Create an account</button>
            </div>
          </div>
        ) : (
          <ActiveView />
        )}
      </div>

      <nav className="bottom-nav">
        {bottomItems.map((n) => (
          <button key={n.id} className={`bn-item${view === n.id ? ' active' : ''}`} onClick={() => go(n.id)}>
            <span className="ic">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((t) => (
            <div className={`toast ${t.type}`} key={t.id} onClick={() => actions.dismissToast(t.id)}>
              <div className="tic">{t.icon || '✓'}</div>
              <div style={{ minWidth: 0 }}>
                <div className="tt">{t.title}</div>
                {t.msg ? <div className="tm">{t.msg}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={(id) => go(id)} />
      <Confetti trigger={confettiN} reduced={state.settings.reduceMotion} />
    </div>
  );
}
