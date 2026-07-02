import { addDays, todayKey } from './dateUtils.js';

export const PILLARS = {
  technical: {
    id: 'technical',
    name: 'Technical & Career Execution',
    short: 'Technical',
    focus: 'Coding · Engineering · Architecture · Deep Work',
    accent: 'blue',
    placeholder: 'e.g. Ship the auth refactor & write its tests',
  },
  physical: {
    id: 'physical',
    name: 'Physical Health & Performance',
    short: 'Physical',
    focus: 'Strength · Nutrition · Conditioning · Discipline',
    accent: 'emerald',
    placeholder: 'e.g. Push day — 5×5 bench + 20 min zone-2',
  },
};

/** A blank day record. Kept flat + explicit so persisted data is easy to reason about. */
export function emptyDay() {
  return {
    status: null, // 'win' | 'miss' | null  — drives the chain + streaks
    technical: { goal: '', goalDone: false, deepWorkMinutes: 0 },
    physical: { goal: '', goalDone: false, workoutDone: false, nutritionDone: false },
  };
}

/** Merge a possibly-partial persisted record onto the current shape. */
export function normalizeDay(raw) {
  const base = emptyDay();
  if (!raw || typeof raw !== 'object') return base;
  return {
    status: raw.status === 'win' || raw.status === 'miss' ? raw.status : null,
    technical: { ...base.technical, ...(raw.technical || {}) },
    physical: { ...base.physical, ...(raw.physical || {}) },
  };
}

export function getDay(days, key) {
  return normalizeDay(days[key]);
}

export function statusOf(days, key) {
  const d = days[key];
  return d && (d.status === 'win' || d.status === 'miss') ? d.status : null;
}

/**
 * Recompute a day's chain status from its non-negotiables. Completing both
 * locks in a "win"; un-completing clears an auto-win but never erases a status
 * the user set by hand (an explicit "miss").
 */
export function statusFromGoals(day) {
  const bothDone =
    !!day.technical.goal && day.technical.goalDone &&
    !!day.physical.goal && day.physical.goalDone;
  if (bothDone) return 'win';
  return day.status === 'win' ? null : day.status;
}

/** 0–100, strictly from completing today's two non-negotiables (50% each). */
export function disciplineScore(day) {
  let score = 0;
  if (day.technical.goal && day.technical.goalDone) score += 50;
  if (day.physical.goal && day.physical.goalDone) score += 50;
  return score;
}

/** Consecutive winning days ending at (or through) today. */
export function currentStreak(days, anchor = todayKey()) {
  const today = statusOf(days, anchor);
  if (today === 'miss') return 0;

  let streak = 0;
  let cursor = anchor;
  if (today === 'win') {
    streak = 1;
    cursor = addDays(anchor, -1);
  } else {
    // Today is still pending — the chain remains alive through yesterday.
    cursor = addDays(anchor, -1);
  }
  while (statusOf(days, cursor) === 'win') {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest run of adjacent winning days ever recorded. */
export function longestStreak(days) {
  const wins = Object.keys(days)
    .filter((k) => statusOf(days, k) === 'win')
    .sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of wins) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

export function totalWins(days) {
  return Object.keys(days).filter((k) => statusOf(days, k) === 'win').length;
}

/**
 * "Never Miss Twice" signal. A single miss is human; two in a row is a pattern.
 * When yesterday was a miss, today becomes non-negotiable.
 */
export function neverMissTwice(days, anchor = todayKey()) {
  const yesterday = statusOf(days, addDays(anchor, -1));
  const today = statusOf(days, anchor);
  return {
    missedYesterday: yesterday === 'miss',
    todaySecured: today === 'win',
    brokeToday: today === 'miss',
    atRisk: yesterday === 'miss' && today !== 'win',
  };
}
