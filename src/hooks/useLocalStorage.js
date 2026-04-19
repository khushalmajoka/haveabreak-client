import { useState } from 'react';

// ── useLocalStorage ───────────────────────────────────────────────────────────
// Drop-in replacement for useState that persists to localStorage.
// Returns [value, setValue] exactly like useState.
//
// Usage:
//   const [playerName, setPlayerName] = useLocalStorage(STORAGE_KEYS.PLAYER_NAME, '');
//
// Notes:
//   - getValue is read once on mount (same as useState initial value)
//   - setValue writes to both React state and localStorage atomically
//   - Pass null as defaultValue if the key is optional

function useLocalStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (err) {
      // localStorage can be blocked in private browsing on some browsers
      console.warn(`useLocalStorage: could not read key "${key}"`, err);
      return defaultValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn(`useLocalStorage: could not write key "${key}"`, err);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;