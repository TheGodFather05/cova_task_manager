import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'
import {
  applyTheme,
  readStoredPreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSystemTheme() {
  return window.matchMedia(DARK_QUERY).matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)

  // the OS preference is external state, so it is subscribed to rather than mirrored
  const systemPrefersDark = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, () => false)

  // derived during render: no effect, no cascading re-render
  const resolved = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // storage unavailable: the choice still applies for this session
    }
  }, [])

  // the only side effect: push the resolved theme onto the document the inline script set up
  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      setPreference,
      toggle: () => setPreference(resolved === 'dark' ? 'light' : 'dark'),
    }),
    [preference, resolved, setPreference],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
