import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { todayKey } from '../lib/dateUtils.js';
import { normalizeDay, statusFromGoals } from '../lib/discipline.js';
import { clamp } from '../lib/format.js';
import {
  ACHIEVEMENTS,
  THEMES,
  difficultyFor,
  levelFromXp,
  randomMicroAction,
} from './defaults.js';
import * as auth from './auth.js';
import { computeStats } from './selectors.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const clone = (x) => JSON.parse(JSON.stringify(x));
const stateKey = (userId) => `des.u.${userId}.state.v1`;

const freshTimer = () => ({ running: false, endsAt: null, remaining: 300, completed: false });

function freshState() {
  return {
    version: 2,
    gamification: {
      xp: 0,
      coins: 100,
      gems: 5,
      achievements: {},
      titles: ['Beginner'],
      activeTitle: 'Beginner',
      unlockedThemes: ['emerald'],
      streakShields: 0,
    },
    settings: { theme: 'emerald', reduceMotion: false, sound: false },
    profile: { bio: '' },
    days: {},
    timers: { technical: freshTimer(), physical: freshTimer() },
    awards: {},
    microActions: {},
    habits: [],
    focusSessions: [],
    journal: [],
    notes: [],
    water: {},
    waterGoal: 8,
    sleep: {},
    mood: [],
    challenges: {},
    purchases: [],
    notifications: [],
  };
}

function loadState(userId) {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(stateKey(userId)) || 'null');
  } catch {
    raw = null;
  }
  const base = freshState();
  if (raw && typeof raw === 'object') {
    return {
      ...base,
      ...raw,
      gamification: { ...base.gamification, ...(raw.gamification || {}) },
      settings: { ...base.settings, ...(raw.settings || {}) },
      profile: { ...base.profile, ...(raw.profile || {}) },
      timers: { ...base.timers, ...(raw.timers || {}) },
      awards: raw.awards || {},
      microActions: raw.microActions || {},
      habits: raw.habits || [],
      focusSessions: raw.focusSessions || [],
      journal: raw.journal || [],
      notes: raw.notes || [],
      water: raw.water || {},
      sleep: raw.sleep || {},
      mood: raw.mood || [],
      challenges: raw.challenges || {},
      purchases: raw.purchases || [],
      notifications: raw.notifications || [],
    };
  }

  // First run for this user: migrate any legacy single-user DES data once.
  try {
    const legacyDays = JSON.parse(localStorage.getItem('des.days.v1') || 'null');
    const legacyTimers = JSON.parse(localStorage.getItem('des.timers.v1') || 'null');
    if (legacyDays && Object.keys(legacyDays).length) {
      base.days = legacyDays;
      if (legacyTimers) base.timers = { ...base.timers, ...legacyTimers };
      localStorage.removeItem('des.days.v1');
      localStorage.removeItem('des.timers.v1');
    }
  } catch { /* ignore */ }
  return base;
}

function applyTheme(themeId, reduceMotion) {
  const t = THEMES[themeId] || THEMES.emerald;
  const root = document.documentElement;
  root.style.setProperty('--brand', t.accent);
  root.style.setProperty('--brand-2', t.accent2);
  root.classList.toggle('reduce-motion', !!reduceMotion);
}

function pushNotif(draft, type, message) {
  draft.notifications.unshift({ id: rid(), type, message, at: new Date().toISOString(), read: false });
  if (draft.notifications.length > 60) draft.notifications.length = 60;
}

function earnXp(draft, xp, toastArr, label) {
  if (!xp) return;
  const g = draft.gamification;
  const before = levelFromXp(g.xp).level;
  g.xp += xp;
  g.coins += Math.floor(xp / 2);
  const after = levelFromXp(g.xp).level;
  toastArr.push({ type: 'xp', title: `+${xp} XP`, msg: label || '', icon: '⚡' });
  if (after > before) {
    toastArr.push({ type: 'level', title: `Level ${after}!`, msg: 'You leveled up', icon: '⭐' });
    pushNotif(draft, 'level', `Reached level ${after}`);
  }
}

function evaluateAchievements(draft, toastArr) {
  let changed = true;
  let guard = 0;
  while (changed && guard < 6) {
    changed = false;
    guard += 1;
    const stats = computeStats(draft);
    for (const a of ACHIEVEMENTS) {
      if (draft.gamification.achievements[a.id]) continue;
      if (a.check(stats)) {
        draft.gamification.achievements[a.id] = new Date().toISOString();
        draft.gamification.xp += a.xp;
        draft.gamification.coins += Math.floor(a.xp / 2);
        toastArr.push({ type: 'achievement', title: a.name, msg: `${a.desc} · +${a.xp} XP`, icon: a.icon });
        pushNotif(draft, 'achievement', `Unlocked: ${a.name}`);
        changed = true;
      }
    }
  }
}

function ensureDailyMicro(draft) {
  const today = todayKey();
  if (draft.microActions[today] && draft.microActions[today].length) return false;
  const stats = computeStats(draft);
  const diff = difficultyFor(stats.totalActions);
  const order = ['health', 'mental', 'learning', 'finance', 'social', 'creativity'];
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const start = doy % order.length;
  const chosen = [order[start % 6], order[(start + 2) % 6], order[(start + 4) % 6]];
  draft.microActions[today] = chosen.map((cat) => {
    const { text, xp } = randomMicroAction(cat, diff);
    return { id: rid(), category: cat, text, xp, done: false, doneAt: null, skipped: false, custom: false };
  });
  return true;
}

export function StoreProvider({ user, setUser, onLogout, children }) {
  const [state, setState] = useState(() => loadState(user.id));
  const [toasts, setToasts] = useState([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Re-load when the active user changes.
  useEffect(() => {
    const loaded = loadState(user.id);
    stateRef.current = loaded;
    setState(loaded);
  }, [user.id]);

  // Persist.
  useEffect(() => {
    try {
      localStorage.setItem(stateKey(user.id), JSON.stringify(state));
    } catch (err) {
      console.warn('store: persist failed', err);
    }
  }, [state, user.id]);

  // Theme + reduced motion.
  useEffect(() => {
    applyTheme(state.settings.theme, state.settings.reduceMotion);
  }, [state.settings.theme, state.settings.reduceMotion]);

  const pushToasts = useCallback((arr) => {
    if (!arr || !arr.length) return;
    const withIds = arr.map((x) => ({ id: rid(), ...x }));
    setToasts((t) => [...t, ...withIds]);
    withIds.forEach((x) => {
      setTimeout(() => setToasts((t) => t.filter((y) => y.id !== x.id)), 4200);
    });
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const commit = useCallback(
    (mutator) => {
      const draft = clone(stateRef.current);
      const toastArr = [];
      const ctx = {
        earn: (xp, label) => earnXp(draft, xp, toastArr, label),
        spend: (cost) => {
          if ((draft.gamification.coins || 0) < cost) return false;
          draft.gamification.coins -= cost;
          return true;
        },
        toast: (t) => toastArr.push(t),
        notif: (type, msg) => pushNotif(draft, type, msg),
      };
      mutator(draft, ctx);
      evaluateAchievements(draft, toastArr);
      stateRef.current = draft;
      setState(draft);
      if (toastArr.length) pushToasts(toastArr);
    },
    [pushToasts],
  );

  // Generate today's micro-actions on load / day change.
  useEffect(() => {
    commit((draft) => { ensureDailyMicro(draft); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const actions = useMemo(() => {
    const T = () => todayKey();
    const patchToday = (fn) =>
      commit((draft, ctx) => {
        const cur = normalizeDay(draft.days[T()]);
        fn(cur, draft, ctx);
        cur.status = statusFromGoals(cur);
        draft.days[T()] = cur;
      });

    return {
      /* ---- Non-negotiables (Rule of 2) ---- */
      setGoal: (pillar, text) => patchToday((d) => { d[pillar].goal = text; }),
      clearGoal: (pillar) => patchToday((d) => { d[pillar].goal = ''; d[pillar].goalDone = false; }),
      toggleGoalDone: (pillar) =>
        patchToday((d, draft, ctx) => {
          d[pillar].goalDone = !d[pillar].goalDone;
          const key = `neg:${T()}:${pillar}`;
          if (d[pillar].goalDone && d[pillar].goal && !draft.awards[key]) {
            draft.awards[key] = true;
            ctx.earn(20, `${pillar === 'technical' ? 'Technical' : 'Physical'} non-negotiable`);
          }
        }),
      deepWorkDelta: (delta) => patchToday((d) => { d.technical.deepWorkMinutes = clamp((d.technical.deepWorkMinutes || 0) + delta, 0, 1440); }),
      deepWorkSet: (v) => patchToday((d) => { d.technical.deepWorkMinutes = clamp(v, 0, 1440); }),
      toggleWorkout: () => patchToday((d) => { d.physical.workoutDone = !d.physical.workoutDone; }),
      toggleNutrition: () => patchToday((d) => { d.physical.nutritionDone = !d.physical.nutritionDone; }),

      cycleChain: (dateKey) =>
        commit((draft) => {
          const cur = normalizeDay(draft.days[dateKey]);
          cur.status = cur.status === 'win' ? 'miss' : cur.status === 'miss' ? null : 'win';
          draft.days[dateKey] = cur;
        }),

      useStreakShield: (dateKey) =>
        commit((draft, ctx) => {
          if ((draft.gamification.streakShields || 0) <= 0) {
            ctx.toast({ type: 'error', title: 'No streak shields', msg: 'Buy one in the rewards shop', icon: '🛡️' });
            return;
          }
          const cur = normalizeDay(draft.days[dateKey]);
          if (cur.status === 'win') return;
          cur.status = 'win';
          cur.shielded = true;
          draft.days[dateKey] = cur;
          draft.gamification.streakShields -= 1;
          ctx.toast({ type: 'reward', title: 'Streak protected 🛡️', msg: 'Shield used to restore the day', icon: '🛡️' });
          ctx.notif('streak', 'Used a Streak Shield to keep your chain alive');
        }),

      setTimer: (pillar, next) =>
        commit((draft, ctx) => {
          const prev = draft.timers[pillar] || freshTimer();
          draft.timers[pillar] = next;
          if (next.completed && !prev.completed) ctx.earn(5, 'Momentum beaten');
        }),

      /* ---- Micro-actions ---- */
      completeMicro: (id) =>
        commit((draft, ctx) => {
          const list = draft.microActions[T()] || [];
          const a = list.find((x) => x.id === id);
          if (!a || a.done) return;
          a.done = true;
          a.doneAt = new Date().toISOString();
          ctx.earn(a.xp || 12, 'Micro-action');
        }),
      skipMicro: (id) =>
        commit((draft) => {
          const list = draft.microActions[T()] || [];
          const a = list.find((x) => x.id === id);
          if (a && !a.done) a.skipped = true;
        }),
      addCustomMicro: (category, text) =>
        commit((draft) => {
          if (!text.trim()) return;
          if (!draft.microActions[T()]) draft.microActions[T()] = [];
          draft.microActions[T()].push({ id: rid(), category, text: text.trim(), xp: 15, done: false, doneAt: null, skipped: false, custom: true });
        }),
      refreshMicro: () =>
        commit((draft) => {
          const list = draft.microActions[T()] || [];
          draft.microActions[T()] = list.filter((a) => a.done);
          ensureDailyMicro(draft);
        }),

      /* ---- Habits ---- */
      addHabit: (h) =>
        commit((draft) => {
          draft.habits.push({ id: rid(), name: h.name.trim(), icon: h.icon || '⚡', color: h.color || '#34d399', category: h.category || 'health', cue: h.cue || '', routine: h.routine || '', reward: h.reward || '', createdAt: new Date().toISOString(), logs: {} });
        }),
      editHabit: (id, patch) =>
        commit((draft) => {
          const h = draft.habits.find((x) => x.id === id);
          if (h) Object.assign(h, patch);
        }),
      deleteHabit: (id) => commit((draft) => { draft.habits = draft.habits.filter((x) => x.id !== id); }),
      toggleHabitToday: (id) =>
        commit((draft, ctx) => {
          const h = draft.habits.find((x) => x.id === id);
          if (!h) return;
          const today = T();
          if (h.logs[today]) {
            delete h.logs[today];
          } else {
            h.logs[today] = new Date().toISOString();
            const key = `habit:${id}:${today}`;
            if (!draft.awards[key]) { draft.awards[key] = true; ctx.earn(15, h.name); }
          }
        }),

      /* ---- Focus ---- */
      logFocus: ({ minutes, type, category }) =>
        commit((draft, ctx) => {
          draft.focusSessions.unshift({ id: rid(), minutes, type: type || 'focus', category: category || 'mental', at: new Date().toISOString() });
          if (draft.focusSessions.length > 200) draft.focusSessions.length = 200;
          ctx.earn(Math.min((minutes || 5) * 3, 100), 'Focus session');
        }),

      /* ---- Journal ---- */
      addJournal: (entry) =>
        commit((draft, ctx) => {
          if (!entry.content?.trim()) return;
          draft.journal.unshift({ id: rid(), content: entry.content.trim(), mood: entry.mood ?? null, energy: entry.energy ?? null, tags: entry.tags || [], gratitude: entry.gratitude || [], at: new Date().toISOString(), words: entry.content.trim().split(/\s+/).length });
          ctx.earn(10, 'Journal entry');
        }),
      deleteJournal: (id) => commit((draft) => { draft.journal = draft.journal.filter((x) => x.id !== id); }),

      /* ---- Notes ---- */
      addNote: (note) => commit((draft) => { if (note.content?.trim()) draft.notes.unshift({ id: rid(), content: note.content.trim(), color: note.color || '#34d399', pinned: false, at: new Date().toISOString() }); }),
      togglePin: (id) => commit((draft) => { const n = draft.notes.find((x) => x.id === id); if (n) n.pinned = !n.pinned; }),
      deleteNote: (id) => commit((draft) => { draft.notes = draft.notes.filter((x) => x.id !== id); }),

      /* ---- Wellness ---- */
      addWater: (n = 1) => commit((draft) => { const t = T(); draft.water[t] = clamp((draft.water[t] || 0) + n, 0, 30); }),
      setWaterGoal: (n) => commit((draft) => { draft.waterGoal = clamp(n, 1, 20); }),
      setSleep: (date, data) => commit((draft) => { draft.sleep[date] = { ...(draft.sleep[date] || {}), ...data }; }),
      addMood: (m) => commit((draft) => { draft.mood.unshift({ id: rid(), at: new Date().toISOString(), date: T(), mood: m.mood, energy: m.energy, stress: m.stress, note: m.note || '' }); if (draft.mood.length > 200) draft.mood.length = 200; }),

      /* ---- Challenges ---- */
      joinChallenge: (id) => commit((draft) => { draft.challenges[id] = { joined: true, joinedAt: new Date().toISOString(), completed: false }; }),
      claimChallenge: (challenge) =>
        commit((draft, ctx) => {
          const c = draft.challenges[challenge.id];
          if (!c || c.completed) return;
          c.completed = true;
          c.completedAt = new Date().toISOString();
          ctx.earn(challenge.xp, challenge.title);
          ctx.notif('challenge', `Challenge complete: ${challenge.title}`);
        }),

      /* ---- Rewards shop ---- */
      buyReward: (reward) =>
        commit((draft, ctx) => {
          if (draft.purchases.includes(reward.id) && reward.type !== 'mystery' && reward.type !== 'item') return;
          if (!ctx.spend(reward.cost)) { ctx.toast({ type: 'error', title: 'Not enough coins', msg: `Need ${reward.cost} 🪙`, icon: '🪙' }); return; }
          draft.purchases.push(reward.id);
          if (reward.type === 'title') { if (!draft.gamification.titles.includes(reward.value)) draft.gamification.titles.push(reward.value); ctx.toast({ type: 'reward', title: 'Title unlocked', msg: reward.value, icon: reward.icon }); }
          else if (reward.type === 'theme') { if (!draft.gamification.unlockedThemes.includes(reward.value)) draft.gamification.unlockedThemes.push(reward.value); ctx.toast({ type: 'reward', title: 'Theme unlocked', msg: reward.name, icon: reward.icon }); }
          else if (reward.type === 'item') { draft.gamification.streakShields += 1; ctx.toast({ type: 'reward', title: 'Streak Shield +1', msg: 'Protects a missed day', icon: '🛡️' }); }
          else if (reward.type === 'mystery') { const bonus = 50 + Math.floor(Math.random() * 100); ctx.earn(bonus, 'Mystery box'); }
        }),
      setActiveTitle: (title) => commit((draft) => { if (draft.gamification.titles.includes(title)) draft.gamification.activeTitle = title; }),
      setTheme: (themeId) => commit((draft) => { if (draft.gamification.unlockedThemes.includes(themeId)) draft.settings.theme = themeId; }),

      /* ---- Profile / settings ---- */
      setBio: (bio) => commit((draft) => { draft.profile.bio = bio; }),
      setSetting: (key, value) => commit((draft) => { draft.settings[key] = value; }),
      updateProfile: (name, avatarColor) => {
        auth.updateAccount(user.id, { name, avatarColor });
        setUser({ ...auth.getUserById(user.id) });
      },

      /* ---- Notifications ---- */
      markNotificationsRead: () => commit((draft) => { draft.notifications.forEach((n) => { n.read = true; }); }),
      clearNotifications: () => commit((draft) => { draft.notifications = []; }),

      /* ---- Data ---- */
      exportData: () => ({ app: 'The Daily Execution System', exportedAt: new Date().toISOString(), account: { name: user.name, avatarColor: user.avatarColor }, state: stateRef.current }),
      importData: (payload) =>
        commit((draft) => {
          const incoming = payload?.state || payload;
          if (!incoming || typeof incoming !== 'object') return;
          Object.assign(draft, loadStateFromObject(incoming));
        }),
      resetData: () => {
        const fresh = freshState();
        stateRef.current = fresh;
        setState(fresh);
      },

      pushToast: (t) => pushToasts([t]),
      dismissToast,
      logout: onLogout,
    };
  }, [commit, dismissToast, onLogout, pushToasts, setUser, user.id, user.name, user.avatarColor]);

  const derived = useMemo(() => {
    const stats = computeStats(state);
    return { stats, level: levelFromXp(stats.xp) };
  }, [state]);

  const value = useMemo(() => ({ state, actions, derived, toasts, user }), [state, actions, derived, toasts, user]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function loadStateFromObject(obj) {
  const base = freshState();
  return {
    ...base,
    ...obj,
    gamification: { ...base.gamification, ...(obj.gamification || {}) },
    settings: { ...base.settings, ...(obj.settings || {}) },
    profile: { ...base.profile, ...(obj.profile || {}) },
    timers: { ...base.timers, ...(obj.timers || {}) },
  };
}
