// Tiny Web Audio SFX. All gated by the caller (respects the sound setting) and
// wrapped in try/catch so a blocked/again-unavailable AudioContext never throws.
let ctx;
function ac() {
  if (ctx === undefined) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = AC ? new AC() : null;
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.06) {
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(a.destination);
  const t = a.currentTime + start;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function resume() {
  const a = ac();
  if (a && a.state === 'suspended') a.resume().catch(() => {});
}

export function playLevelUp(enabled) {
  if (!enabled) return;
  try {
    resume();
    tone(523.25, 0, 0.16);
    tone(659.25, 0.12, 0.16);
    tone(783.99, 0.24, 0.28);
  } catch { /* ignore */ }
}

export function playPop(enabled) {
  if (!enabled) return;
  try {
    resume();
    tone(660, 0, 0.08, 'triangle', 0.05);
    tone(880, 0.06, 0.1, 'triangle', 0.05);
  } catch { /* ignore */ }
}
