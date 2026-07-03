import { useEffect, useState } from 'react';
import AuthScreen from './components/auth/AuthScreen.jsx';
import AppShell from './components/shell/AppShell.jsx';
import { StoreProvider } from './store/StoreContext.jsx';
import { api, getToken, setToken } from './api/client.js';
import { clearSession, currentUser } from './store/auth.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Prefer restoring an online (server) session.
      if (getToken()) {
        try {
          const res = await api.me();
          if (!cancelled) {
            setUser({ ...res.user, online: true });
            setReady(true);
          }
          return;
        } catch {
          setToken(null); // expired token or server unreachable
        }
      }
      // Otherwise restore a local guest session if present.
      const local = currentUser();
      if (!cancelled) {
        if (local) setUser({ ...local, online: false });
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <div className="auth">
        <div className="auth-card panel" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuthed={setUser} />;

  const logout = () => {
    setToken(null);
    clearSession();
    setUser(null);
  };

  return (
    <StoreProvider user={user} setUser={setUser} onLogout={logout}>
      <AppShell />
    </StoreProvider>
  );
}
