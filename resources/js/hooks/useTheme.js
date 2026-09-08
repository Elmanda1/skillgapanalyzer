import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
const QUERY = '(prefers-color-scheme: dark)';

function readStoredMode() {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function systemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

function resolve(mode) {
  if (mode === 'system') {
    return systemPrefersDark() ? 'dark' : 'light';
  }
  return mode;
}

function applyToDocument(resolved) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

/**
 * Theme state with localStorage persistence and OS-following `system` default.
 *
 * The `.dark` class on <html> is also applied by an inline script in app.blade.php
 * before first paint; this hook keeps it in sync afterwards.
 */
export function useTheme() {
  const [mode, setModeState] = useState(() => readStoredMode());
  const [resolvedTheme, setResolvedTheme] = useState(() => resolve(readStoredMode()));

  useEffect(() => {
    const resolved = resolve(mode);
    setResolvedTheme(resolved);
    applyToDocument(resolved);

    if (mode !== 'system') {
      return;
    }

    const media = window.matchMedia(QUERY);
    const onChange = () => {
      const next = media.matches ? 'dark' : 'light';
      setResolvedTheme(next);
      applyToDocument(next);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next) => {
    const nextResolved = resolve(next);
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
    setResolvedTheme(nextResolved);
    applyToDocument(nextResolved);
  }, []);

  const toggle = useCallback(() => {
    const current = resolve(mode);
    const next = current === 'dark' ? 'light' : 'dark';
    setMode(next);
  }, [mode, setMode]);

  return { mode, resolvedTheme, setMode, toggle };
}

export default useTheme;
