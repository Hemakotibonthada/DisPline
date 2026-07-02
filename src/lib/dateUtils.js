// Date helpers. Everything is keyed by a local-time YYYY-MM-DD string so a
// "day" always matches the user's wall clock, regardless of timezone.

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Local YYYY-MM-DD for a Date (defaults to now). */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return dateKey(new Date());
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Shift a day key by n days (n can be negative). */
export function addDays(key, n) {
  const date = keyToDate(key);
  date.setDate(date.getDate() + n);
  return dateKey(date);
}

/** ISO weekday index where Monday = 0 ... Sunday = 6. */
export function mondayIndex(key) {
  const jsDay = keyToDate(key).getDay(); // Sun = 0 ... Sat = 6
  return (jsDay + 6) % 7;
}

/** Monday that starts the week containing `key`. */
export function startOfWeek(key) {
  return addDays(key, -mondayIndex(key));
}

/** Build the 28-day (4 week) window ending at the end of this week. */
export function buildChainWindow(anchor = todayKey()) {
  const thisWeekStart = startOfWeek(anchor);
  const gridStart = addDays(thisWeekStart, -21); // three prior weeks
  return Array.from({ length: 28 }, (_, i) => addDays(gridStart, i));
}

/** The last `n` day keys, oldest first, ending today. */
export function lastNDays(n, anchor = todayKey()) {
  return Array.from({ length: n }, (_, i) => addDays(anchor, -(n - 1 - i)));
}

export function weekdayLabels() {
  return WEEKDAY_LABELS;
}

export function shortWeekday(key) {
  return WEEKDAY_LABELS[mondayIndex(key)];
}

/** e.g. "Thursday · July 2, 2026" */
export function formatLongDate(key) {
  const d = keyToDate(key);
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  return `${weekday} · ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** e.g. "Jul 2" */
export function formatShortDate(key) {
  const d = keyToDate(key);
  return `${MONTH_LABELS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function isToday(key) {
  return key === todayKey();
}

export function isFuture(key) {
  return key > todayKey();
}

export function isPast(key) {
  return key < todayKey();
}
