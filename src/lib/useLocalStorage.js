import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State that transparently persists to localStorage. Writes are guarded so a
 * private-mode / quota error never crashes the app, and multiple tabs stay in
 * sync via the native `storage` event.
 */
export function useLocalStorage(key, initialValue) {
  const readValue = useCallback(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`useLocalStorage: failed to read "${key}"`, err);
      return initialValue;
    }
  }, [key, initialValue]);

  const [stored, setStored] = useState(readValue);

  // Keep the latest value in a ref so the functional-update form works even if
  // the caller passes an updater that references previous state.
  const storedRef = useRef(stored);
  storedRef.current = stored;

  const setValue = useCallback(
    (value) => {
      const next = value instanceof Function ? value(storedRef.current) : value;
      setStored(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        console.warn(`useLocalStorage: failed to write "${key}"`, err);
      }
    },
    [key],
  );

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStored(JSON.parse(event.newValue));
        } catch {
          /* ignore malformed cross-tab payloads */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [stored, setValue];
}
