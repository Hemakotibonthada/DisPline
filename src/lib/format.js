export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** minutes -> "2h 30m" / "45m" / "0m" */
export function formatDuration(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes || 0));
  if (m === 0) return '0m';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
}

/** seconds -> "05:00" */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
