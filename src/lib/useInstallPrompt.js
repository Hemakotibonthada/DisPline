import { useEffect, useState } from 'react';

/**
 * Captures the browser's install prompt so we can surface an in-app
 * "Install" button. `canInstall` is only true when the browser is willing to
 * install and the app isn't already running standalone.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(() => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch { /* ignore */ }
    setDeferred(null);
  };

  return { canInstall: !!deferred && !installed, promptInstall };
}
