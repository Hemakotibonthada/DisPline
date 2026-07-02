import { useState } from 'react';
import { AVATAR_COLORS } from '../../store/defaults.js';
import { accountCount, login, loginAsGuest, register } from '../../store/auth.js';

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState(accountCount() > 0 ? 'login' : 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    // Hashing is synchronous but can take a beat on mobile — yield a frame first.
    setTimeout(() => {
      const res =
        mode === 'register'
          ? register({ name, email, password, avatarColor })
          : login({ email, password });
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onAuthed(res.user);
    }, 10);
  };

  const guest = () => {
    const res = loginAsGuest();
    if (res.ok) onAuthed(res.user);
  };

  return (
    <div className="auth">
      <div className="auth-card panel">
        <div className="auth-brand">
          <div className="auth-logo">◆</div>
          <div className="kick">The Daily Execution System</div>
          <h1>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
          <p>Ruthless focus. Unforgiving consistency. Minimalist metrics.</p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            Log in
          </button>
          <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
            Sign up
          </button>
        </div>

        {error ? <div className="auth-error">⚠ {error}</div> : null}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label>Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={40} autoComplete="name" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label>Avatar color</label>
              <div className="avatar-picker">
                {AVATAR_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`avatar-dot${avatarColor === c ? ' sel' : ''}`}
                    style={{ background: c }}
                    onClick={() => setAvatarColor(c)}
                    aria-label={`Pick color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          <button className="btn solid block" type="submit" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? 'Securing…' : mode === 'register' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="auth-foot">
          {mode === 'register' ? 'Already have an account? ' : 'New here? '}
          <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
            {mode === 'register' ? 'Log in' : 'Create one'}
          </button>
          <span style={{ margin: '0 8px', color: 'var(--text-ghost)' }}>·</span>
          <button onClick={guest}>Continue as guest</button>
        </div>

        <div className="auth-note">
          🔒 Accounts are stored locally on this device. This is a personal, offline-first tracker —
          no data leaves your browser.
        </div>
      </div>
    </div>
  );
}
