// Static content + game config for The Daily Execution System.
// Ported/adapted from the MicroHabit engine into a single client-side module.

export const CATEGORIES = {
  health: { id: 'health', label: 'Health', icon: '💪', color: '#34d399' },
  finance: { id: 'finance', label: 'Finance', icon: '💰', color: '#fbbf24' },
  learning: { id: 'learning', label: 'Learning', icon: '📚', color: '#60a5fa' },
  social: { id: 'social', label: 'Social', icon: '🤝', color: '#f472b6' },
  mental: { id: 'mental', label: 'Mental', icon: '🧘', color: '#a78bfa' },
  creativity: { id: 'creativity', label: 'Creativity', icon: '🎨', color: '#fb923c' },
};
export const CATEGORY_LIST = Object.values(CATEGORIES);

// Cumulative XP required to reach each level (index 0 = level 1).
export const LEVEL_XP = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000, 30000, 45000, 65000, 100000];

// Accent themes unlockable in the rewards shop.
export const THEMES = {
  emerald: { id: 'emerald', label: 'Emerald', accent: '#34d399', accent2: '#10b981', cost: 0 },
  ocean: { id: 'ocean', label: 'Ocean', accent: '#38bdf8', accent2: '#0ea5e9', cost: 150 },
  sunset: { id: 'sunset', label: 'Sunset', accent: '#fb7185', accent2: '#f43f5e', cost: 150 },
  forest: { id: 'forest', label: 'Forest', accent: '#4ade80', accent2: '#22c55e', cost: 150 },
  violet: { id: 'violet', label: 'Violet', accent: '#a78bfa', accent2: '#8b5cf6', cost: 150 },
  amber: { id: 'amber', label: 'Amber', accent: '#fbbf24', accent2: '#f59e0b', cost: 150 },
};

export const AVATAR_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#f87171', '#2dd4bf'];

// Achievements evaluate against a computed `stats` object (see selectors.js).
export const ACHIEVEMENTS = [
  { id: 'first_action', name: 'First Step', icon: '👣', desc: 'Complete your first action', xp: 10, check: (s) => s.totalActions >= 1 },
  { id: 'actions_10', name: 'Getting Started', icon: '🌱', desc: 'Complete 10 actions', xp: 20, check: (s) => s.totalActions >= 10 },
  { id: 'actions_50', name: 'Half Century', icon: '🌿', desc: 'Complete 50 actions', xp: 100, check: (s) => s.totalActions >= 50 },
  { id: 'actions_100', name: 'Centurion', icon: '🌳', desc: 'Complete 100 actions', xp: 200, check: (s) => s.totalActions >= 100 },
  { id: 'actions_500', name: 'Habit Legend', icon: '🏔️', desc: 'Complete 500 actions', xp: 1000, check: (s) => s.totalActions >= 500 },
  { id: 'streak_3', name: 'On a Roll', icon: '🔥', desc: '3-day streak', xp: 30, check: (s) => s.longestStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚡', desc: '7-day streak', xp: 70, check: (s) => s.longestStreak >= 7 },
  { id: 'streak_14', name: 'Fortnight Fighter', icon: '💪', desc: '14-day streak', xp: 140, check: (s) => s.longestStreak >= 14 },
  { id: 'streak_30', name: 'Monthly Master', icon: '🏆', desc: '30-day streak', xp: 300, check: (s) => s.longestStreak >= 30 },
  { id: 'streak_100', name: 'Century Streak', icon: '👑', desc: '100-day streak', xp: 1000, check: (s) => s.longestStreak >= 100 },
  { id: 'level_3', name: 'Rising Star', icon: '⭐', desc: 'Reach level 3', xp: 50, check: (s) => s.level >= 3 },
  { id: 'level_5', name: 'Expert', icon: '💎', desc: 'Reach level 5', xp: 100, check: (s) => s.level >= 5 },
  { id: 'level_10', name: 'Grandmaster', icon: '👑', desc: 'Reach level 10', xp: 500, check: (s) => s.level >= 10 },
  { id: 'all_cats', name: 'Renaissance', icon: '🎨', desc: 'Complete actions in all 6 categories', xp: 150, check: (s) => s.categoriesCompleted >= 6 },
  { id: 'journal_5', name: 'Reflective', icon: '📝', desc: 'Write 5 journal entries', xp: 50, check: (s) => s.journals >= 5 },
  { id: 'journal_20', name: 'Deep Thinker', icon: '🧠', desc: 'Write 20 journal entries', xp: 200, check: (s) => s.journals >= 20 },
  { id: 'focus_10', name: 'Focused Mind', icon: '🎯', desc: 'Complete 10 focus sessions', xp: 100, check: (s) => s.focusSessions >= 10 },
  { id: 'water_7', name: 'Hydration Hero', icon: '💧', desc: 'Log water on 7 days', xp: 70, check: (s) => s.waterDays >= 7 },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', desc: 'Complete an action before 8 AM', xp: 50, check: (s) => s.earlyBird },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', desc: 'Complete an action after 10 PM', xp: 50, check: (s) => s.nightOwl },
  { id: 'xp_1000', name: 'XP Hunter', icon: '💫', desc: 'Earn 1000 total XP', xp: 100, check: (s) => s.xp >= 1000 },
  { id: 'xp_5000', name: 'XP Master', icon: '🌠', desc: 'Earn 5000 total XP', xp: 500, check: (s) => s.xp >= 5000 },
  { id: 'habits_3', name: 'Systems Thinker', icon: '⚙️', desc: 'Track 3 habits', xp: 60, check: (s) => s.habitsCount >= 3 },
  { id: 'perfect_day', name: 'Perfect Day', icon: '✨', desc: 'Hit 100% discipline in a day', xp: 80, check: (s) => s.perfectDays >= 1 },
];

export const MILESTONES = [
  { id: 'm_actions_1', name: 'First Action', target: 1, type: 'totalActions', icon: '👣' },
  { id: 'm_actions_10', name: '10 Actions', target: 10, type: 'totalActions', icon: '🌱' },
  { id: 'm_actions_50', name: '50 Actions', target: 50, type: 'totalActions', icon: '🌿' },
  { id: 'm_actions_100', name: '100 Actions', target: 100, type: 'totalActions', icon: '🌳' },
  { id: 'm_actions_500', name: '500 Actions', target: 500, type: 'totalActions', icon: '🏔️' },
  { id: 'm_streak_7', name: '7-Day Streak', target: 7, type: 'longestStreak', icon: '⚡' },
  { id: 'm_streak_30', name: '30-Day Streak', target: 30, type: 'longestStreak', icon: '🏆' },
  { id: 'm_level_5', name: 'Level 5', target: 5, type: 'level', icon: '💎' },
  { id: 'm_level_10', name: 'Level 10', target: 10, type: 'level', icon: '👑' },
  { id: 'm_xp_1000', name: '1,000 XP', target: 1000, type: 'xp', icon: '⭐' },
  { id: 'm_xp_10000', name: '10,000 XP', target: 10000, type: 'xp', icon: '🌟' },
];

export const CHALLENGES = [
  { id: 'c_health7', title: '7-Day Health Sprint', desc: 'Complete a health action every day for 7 days', category: 'health', target: 7, xp: 200, icon: '💪' },
  { id: 'c_learn5', title: '5-Day Learning Quest', desc: 'Complete 5 learning actions', category: 'learning', target: 5, xp: 150, icon: '📚' },
  { id: 'c_mind20', title: 'Mindfulness Month', desc: 'Complete 20 mental actions', category: 'mental', target: 20, xp: 500, icon: '🧘' },
  { id: 'c_focus20', title: 'Focus Champion', desc: 'Complete 20 focus sessions', category: 'all', target: 20, xp: 500, icon: '🏆' },
  { id: 'c_journal10', title: 'Journal Journey', desc: 'Write 10 journal entries', category: 'mental', target: 10, xp: 350, icon: '📝' },
  { id: 'c_iron14', title: 'Iron Streak', desc: 'Reach a 14-day discipline streak', category: 'all', target: 14, xp: 600, icon: '⚡' },
  { id: 'c_create5', title: 'Creative Streak', desc: 'Complete 5 creativity actions', category: 'creativity', target: 5, xp: 200, icon: '🎨' },
  { id: 'c_social10', title: 'Social Butterfly', desc: 'Complete 10 social actions', category: 'social', target: 10, xp: 300, icon: '🦋' },
];

export const REWARDS = [
  { id: 'r_shield', name: 'Streak Shield', desc: 'Protect your streak for one missed day', cost: 50, icon: '🛡️', type: 'item' },
  { id: 'r_title_champion', name: 'Title: Champion', desc: 'Unlock the Champion title', cost: 200, icon: '🏅', type: 'title', value: 'Champion' },
  { id: 'r_title_phoenix', name: 'Title: Phoenix', desc: 'Unlock the Phoenix title', cost: 300, icon: '🔥', type: 'title', value: 'Phoenix' },
  { id: 'r_title_legend', name: 'Title: Legend', desc: 'Unlock the Legend title', cost: 500, icon: '🌟', type: 'title', value: 'Legend' },
  { id: 'r_theme_ocean', name: 'Theme: Ocean', desc: 'Unlock the Ocean accent', cost: 150, icon: '🌊', type: 'theme', value: 'ocean' },
  { id: 'r_theme_sunset', name: 'Theme: Sunset', desc: 'Unlock the Sunset accent', cost: 150, icon: '🌅', type: 'theme', value: 'sunset' },
  { id: 'r_theme_forest', name: 'Theme: Forest', desc: 'Unlock the Forest accent', cost: 150, icon: '🌲', type: 'theme', value: 'forest' },
  { id: 'r_theme_violet', name: 'Theme: Violet', desc: 'Unlock the Violet accent', cost: 150, icon: '🔮', type: 'theme', value: 'violet' },
  { id: 'r_theme_amber', name: 'Theme: Amber', desc: 'Unlock the Amber accent', cost: 150, icon: '🌇', type: 'theme', value: 'amber' },
  { id: 'r_mystery', name: 'Mystery Box', desc: 'A random burst of XP', cost: 100, icon: '🎁', type: 'mystery' },
];

export const TITLES = ['Beginner', 'Operator', 'Disciplined', 'Champion', 'Phoenix', 'Legend'];

export const HABIT_TEMPLATES = [
  { name: 'Drink Water', icon: '💧', color: '#38bdf8', category: 'health', cue: 'After waking up', routine: 'Drink a full glass of water', reward: 'Feel refreshed' },
  { name: 'Read', icon: '📖', color: '#60a5fa', category: 'learning', cue: 'Before bed', routine: 'Read one page', reward: 'Learn something new' },
  { name: 'Meditate', icon: '🧘', color: '#a78bfa', category: 'mental', cue: 'After coffee', routine: 'Breathe for 2 minutes', reward: 'Calm mind' },
  { name: 'Move', icon: '🏃', color: '#34d399', category: 'health', cue: 'Mid-morning', routine: 'Do 10 pushups', reward: 'Energy boost' },
  { name: 'Gratitude', icon: '🙏', color: '#fbbf24', category: 'mental', cue: 'End of day', routine: 'Note one thing you are grateful for', reward: 'Positive close' },
  { name: 'No Sugar', icon: '🚫', color: '#f87171', category: 'health', cue: 'When craving hits', routine: 'Drink water instead', reward: 'Discipline win' },
];

export const AFFIRMATIONS = [
  'I am capable of achieving great things through small daily actions.',
  'Every micro-habit is an investment in my future self.',
  'I choose progress over perfection.',
  'My consistency today creates my success tomorrow.',
  'I am building unbreakable habits one day at a time.',
  'Small steps lead to massive transformations.',
  'I trust the process and celebrate every small win.',
  'My potential is unlimited because my effort is consistent.',
  'I am the architect of my habits and the master of my destiny.',
  'Today I choose growth over comfort.',
  'I embrace the power of compound improvement.',
  'Each action I take is a vote for the person I want to become.',
  'I am resilient, disciplined, and unstoppable.',
  'My habits are my superpower.',
  'I focus on systems, not just goals.',
];

export const QUOTES = [
  '"We are what we repeatedly do. Excellence is a habit." — Aristotle',
  '"A journey of a thousand miles begins with a single step." — Lao Tzu',
  '"Small daily improvements lead to stunning results." — Robin Sharma',
  '"Motivation gets you started, habit keeps you going." — Jim Ryun',
  '"Success is the sum of small efforts repeated day in and day out." — Robert Collier',
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Discipline is choosing what you want most over what you want now."',
  '"Every action you take is a vote for who you wish to become." — James Clear',
  '"You do not rise to the level of your goals. You fall to the level of your systems." — James Clear',
  '"The compound effect is reaping huge rewards from small, smart choices." — Darren Hardy',
];

export const JOURNAL_PROMPTS = [
  'What is one small win you had today?',
  'What drained your energy, and what restored it?',
  'What are you avoiding, and what is the 2-minute version of it?',
  'Who are you becoming through your daily actions?',
  'What would make tomorrow a 1% better day?',
  'What limiting belief showed up today? Reframe it.',
  'What are three things you are grateful for right now?',
  'Describe your ideal execution day in a few sentences.',
];

// 2-minute micro-actions by category and difficulty.
export const MICRO_ACTIONS = {
  health: {
    beginner: ['Do 5 pushups right now', 'Drink a full glass of water', 'Stand up and stretch for 2 minutes', 'Take 10 deep breaths', 'Do 10 jumping jacks', 'Walk around for 2 minutes', 'Do a 2-minute wall sit', 'Do 5 squats', 'Roll your shoulders 20 times', 'Hold a plank for 30 seconds'],
    intermediate: ['Do 15 pushups', 'Do a 1-minute plank', 'Do 20 squats', 'Run in place for 2 minutes', 'Do 10 burpees', 'Do 20 crunches', 'Do 15 lunges', 'Jump rope for 2 minutes'],
    advanced: ['Do 30 pushups', 'Hold a 2-minute plank', 'Do 30 squats', 'Do 15 burpees', 'Do a 2-minute HIIT circuit', 'Do 50 jumping jacks', 'Do 20 mountain climbers'],
  },
  finance: {
    beginner: ['Write down your 3 biggest expenses this week', 'Check your bank balance right now', 'Identify one subscription to cancel', 'Set a spending limit for tomorrow', 'Save $1 right now', 'Research one investment term', 'Write down one financial goal'],
    intermediate: ['Review last 5 transactions and categorize them', 'Research one index fund', 'Calculate your savings rate this month', 'Automate one bill payment', 'Read about compound interest', 'Track every expense today'],
    advanced: ['Analyze monthly spending by category', 'Research one stock/ETF for 2 minutes', 'Calculate your net worth', 'Review one insurance policy', 'Set up automatic investing'],
  },
  learning: {
    beginner: ['Learn one new word in any language', 'Read one paragraph of a book', 'Watch a 2-minute educational video', 'Write one interesting fact learned today', 'Learn one keyboard shortcut', 'Read one Wikipedia summary'],
    intermediate: ['Learn 3 words in a new language', 'Read for 2 minutes from non-fiction', 'Watch a short tutorial on any skill', 'Solve one logic puzzle', 'Learn a new software feature', 'Practice typing for 2 minutes'],
    advanced: ['Learn 5 words in a new language', 'Read a technical article for 2 minutes', 'Solve a coding challenge', 'Learn about a scientific concept', 'Write a complex topic in simple terms'],
  },
  social: {
    beginner: ['Send a genuine compliment', 'Message a friend you have not talked to', 'Write a thank-you note', 'Ask someone how their day really went', 'Hold the door for someone', 'Listen for 2 minutes without interrupting'],
    intermediate: ['Call a family member for 2 minutes', 'Write a positive review for a business', 'Introduce two people who should meet', 'Offer to help someone', 'Share a helpful resource'],
    advanced: ['Organize a virtual coffee with a friend', 'Mentor someone for 2 minutes', 'Write a recommendation for someone', 'Volunteer to help a neighbor', 'Start a conversation with someone new'],
  },
  mental: {
    beginner: ['Write down 3 things you are grateful for', 'Breathe with eyes closed for 1 minute', 'Spend 2 minutes in silence', 'Look out a window for 2 minutes', 'Name 5 see, 4 hear, 3 touch', 'Tidy one small area'],
    intermediate: ['Meditate for 2 minutes', 'Journal about your current emotion', 'Box breathing 4-4-4-4 for 2 minutes', 'Do a body scan meditation', 'Write your biggest win today'],
    advanced: ['Meditate for 5 minutes', 'Write a letter to your future self', 'Loving-kindness meditation', 'Reflect on a challenge and extract a lesson', 'Journal about a limiting belief and reframe it'],
  },
  creativity: {
    beginner: ['Doodle for 2 minutes', 'Write a haiku about your day', 'Take a photo of something interesting', 'Write 3 random words and connect them', 'List 5 unusual uses for a paperclip'],
    intermediate: ['Write a 6-word story', 'Sketch an object without looking down', 'Write a poem about your surroundings', 'Create a color palette from nature', 'Design a simple logo concept'],
    advanced: ['Write flash fiction in 2 minutes', 'Create a mind map of an idea', 'Design a solution for an everyday problem', 'Write a persuasive micro-essay', 'Sketch a futuristic invention'],
  },
};

export function levelFromXp(xp = 0) {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) {
      const nextTotal = LEVEL_XP[i + 1] ?? LEVEL_XP[i] + 20000;
      return {
        level: i + 1,
        xpIntoLevel: xp - LEVEL_XP[i],
        xpForNext: nextTotal - LEVEL_XP[i],
        nextTotal,
      };
    }
  }
  return { level: 1, xpIntoLevel: xp, xpForNext: 100, nextTotal: 100 };
}

export function difficultyFor(totalActions = 0) {
  if (totalActions >= 50) return 'advanced';
  if (totalActions >= 15) return 'intermediate';
  return 'beginner';
}

export function randomMicroAction(category, difficulty) {
  const pool = MICRO_ACTIONS[category]?.[difficulty] || MICRO_ACTIONS.mental.beginner;
  const text = pool[Math.floor(Math.random() * pool.length)];
  const xp = difficulty === 'advanced' ? 25 : difficulty === 'intermediate' ? 18 : 12;
  return { text, xp };
}

export function pickDaily(list, seed) {
  // Deterministic pick per-day so "today's" affirmation/quote is stable.
  let h = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}
