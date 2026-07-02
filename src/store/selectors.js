import { currentStreak, disciplineScore, longestStreak, normalizeDay, statusOf } from '../lib/discipline.js';
import { addDays, todayKey } from '../lib/dateUtils.js';
import { levelFromXp } from './defaults.js';

/** One rolled-up stats object used by achievements, milestones and the Progress view. */
export function computeStats(state) {
  const days = state.days || {};
  const micro = state.microActions || {};
  const habits = state.habits || [];
  const focus = state.focusSessions || [];
  const journal = state.journal || [];
  const water = state.water || {};
  const g = state.gamification || { xp: 0, coins: 0 };

  const cats = new Set();
  let microDone = 0;
  let earlyBird = false;
  let nightOwl = false;
  for (const date in micro) {
    for (const a of micro[date]) {
      if (!a.done) continue;
      microDone += 1;
      cats.add(a.category);
      if (a.doneAt) {
        const h = new Date(a.doneAt).getHours();
        if (h < 8) earlyBird = true;
        if (h >= 22) nightOwl = true;
      }
    }
  }

  let habitLogs = 0;
  for (const h of habits) {
    const n = Object.keys(h.logs || {}).length;
    habitLogs += n;
    if (n) cats.add(h.category);
  }

  let nonNegDone = 0;
  let perfectDays = 0;
  for (const date in days) {
    const d = normalizeDay(days[date]);
    if (d.technical.goal && d.technical.goalDone) nonNegDone += 1;
    if (d.physical.goal && d.physical.goalDone) nonNegDone += 1;
    if (disciplineScore(d) >= 100) perfectDays += 1;
  }

  const level = levelFromXp(g.xp || 0).level;

  return {
    totalActions: microDone + habitLogs + nonNegDone,
    microDone,
    habitLogs,
    nonNegDone,
    categoriesCompleted: cats.size,
    earlyBird,
    nightOwl,
    perfectDays,
    currentStreak: currentStreak(days),
    longestStreak: Math.max(longestStreak(days), currentStreak(days)),
    waterDays: Object.keys(water).filter((dt) => (water[dt] || 0) > 0).length,
    focusSessions: focus.length,
    focusMinutes: focus.reduce((s, f) => s + (f.minutes || 0), 0),
    journals: journal.length,
    habitsCount: habits.length,
    xp: g.xp || 0,
    level,
    coins: g.coins || 0,
  };
}

/** Category -> count of completed micro-actions, for the breakdown chart. */
export function categoryBreakdown(state) {
  const micro = state.microActions || {};
  const counts = {};
  for (const date in micro) for (const a of micro[date]) if (a.done) counts[a.category] = (counts[a.category] || 0) + 1;
  return counts;
}

/** date -> intensity (0..n) for a rolling heatmap over `days` back from today. */
export function activityHeatmap(state, days = 119) {
  const map = {};
  const micro = state.microActions || {};
  const habits = state.habits || [];
  const dayRecords = state.days || {};

  const bump = (date, n = 1) => { if (date) map[date] = (map[date] || 0) + n; };
  for (const date in micro) for (const a of micro[date]) if (a.done) bump(date);
  for (const h of habits) for (const date in (h.logs || {})) bump(date);
  for (const date in dayRecords) {
    const s = statusOf(dayRecords, date);
    if (s === 'win') bump(date, 1);
  }

  const cells = [];
  const anchor = todayKey();
  for (let i = days - 1; i >= 0; i--) {
    const key = addDays(anchor, -i);
    cells.push({ date: key, count: map[key] || 0 });
  }
  return cells;
}

/** Local leaderboard across every account on this device. */
export function localLeaderboard() {
  try {
    const accounts = JSON.parse(localStorage.getItem('des.accounts.v1') || '[]');
    return accounts
      .map((a) => {
        let state = null;
        try {
          state = JSON.parse(localStorage.getItem(`des.u.${a.id}.state.v1`) || 'null');
        } catch { state = null; }
        const g = state?.gamification || { xp: 0 };
        const s = state ? computeStats(state) : { currentStreak: 0, totalActions: 0 };
        return {
          id: a.id,
          name: a.name,
          avatarColor: a.avatarColor,
          isGuest: a.isGuest,
          xp: g.xp || 0,
          level: levelFromXp(g.xp || 0).level,
          streak: s.currentStreak || 0,
          actions: s.totalActions || 0,
        };
      })
      .sort((x, y) => y.xp - x.xp);
  } catch {
    return [];
  }
}
