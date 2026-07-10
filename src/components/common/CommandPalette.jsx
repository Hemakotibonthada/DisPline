import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/storeContext.js';

export default function CommandPalette({ open, onClose, onNavigate }) {
  const { actions } = useStore();
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  const commands = useMemo(() => {
    const nav = (id, icon, label) => ({ id, icon, label, hint: 'Navigate', run: () => onNavigate(id) });
    return [
      nav('today', '◎', 'Go to Today'),
      nav('habits', '🔁', 'Go to Habits'),
      nav('focus', '🎯', 'Go to Focus'),
      nav('journal', '📝', 'Go to Journal'),
      nav('wellness', '🌿', 'Go to Wellness'),
      nav('progress', '📈', 'Go to Progress'),
      nav('social', '🤝', 'Go to Friends'),
      nav('profile', '👤', 'Go to Profile'),
      { id: 'water', icon: '💧', label: 'Add a glass of water', hint: 'Action', run: () => actions.addWater(1) },
      { id: 'micro', icon: '⚡', label: 'Refresh micro-actions', hint: 'Action', run: () => { actions.refreshMicro(); onNavigate('today'); } },
      { id: 'focus-start', icon: '⏱', label: 'Start a focus session', hint: 'Action', run: () => onNavigate('focus') },
      { id: 'journal-new', icon: '✍', label: 'New journal entry', hint: 'Action', run: () => onNavigate('journal') },
      { id: 'habit-new', icon: '➕', label: 'New habit', hint: 'Action', run: () => onNavigate('habits') },
      { id: 'mood', icon: '🙂', label: 'Log your mood', hint: 'Action', run: () => onNavigate('wellness') },
      { id: 'logout', icon: '⎋', label: 'Log out', hint: 'Account', run: () => actions.logout() },
    ];
  }, [actions, onNavigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => { if (sel >= filtered.length) setSel(0); }, [filtered.length, sel]);

  if (!open) return null;

  const run = (cmd) => { cmd.run(); onClose(); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % Math.max(filtered.length, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + filtered.length) % Math.max(filtered.length, 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[sel]) run(filtered[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="cmdk panel" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Search commands…  (↑↓ to move · ↵ to run · esc to close)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="cmdk-list">
          {filtered.map((c, i) => (
            <button
              key={c.id}
              className={`cmdk-item${i === sel ? ' sel' : ''}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => run(c)}
            >
              <span className="cmdk-ic">{c.icon}</span>
              <span className="cmdk-label">{c.label}</span>
              <span className="cmdk-hint">{c.hint}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="empty" style={{ padding: 18 }}>No matching commands.</div>}
        </div>
      </div>
    </div>
  );
}
