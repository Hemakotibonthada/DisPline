import { useState } from 'react';
import AuthScreen from './components/auth/AuthScreen.jsx';
import AppShell from './components/shell/AppShell.jsx';
import { StoreProvider } from './store/StoreContext.jsx';
import { clearSession, currentUser } from './store/auth.js';

export default function App() {
  const [user, setUser] = useState(() => currentUser());

  if (!user) return <AuthScreen onAuthed={setUser} />;

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <StoreProvider user={user} setUser={setUser} onLogout={logout}>
      <AppShell />
    </StoreProvider>
  );
}
