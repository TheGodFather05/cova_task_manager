import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, getAccessToken, setAccessToken, setSessionExpiredHandler } from '../api'
import type { Credentials } from '../types/auth'
import { AuthContext, type AuthContextValue } from './AuthContext'

const EMAIL_KEY = 'tm-email'

function readStoredEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY)
  } catch {
    return null
  }
}

function writeStoredEmail(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(EMAIL_KEY, email)
    } else {
      localStorage.removeItem(EMAIL_KEY)
    }
  } catch {
    // storage unavailable: the session still works until reload
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // read synchronously so an already-signed-in user never sees a flash of the login page
  const [email, setEmail] = useState<string | null>(() =>
    getAccessToken() ? readStoredEmail() : null,
  )

  // the client cannot import React state, so it reports an unrecoverable 401 through here
  useEffect(() => {
    setSessionExpiredHandler(() => {
      writeStoredEmail(null)
      setEmail(null)
    })
    return () => setSessionExpiredHandler(() => {})
  }, [])

  const authenticate = useCallback(
    async (credentials: Credentials, action: typeof authApi.login) => {
      const response = await action(credentials)
      writeStoredEmail(response.email)
      setEmail(response.email)
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      email,
      isAuthenticated: email !== null,
      login: (credentials) => authenticate(credentials, authApi.login),
      register: (credentials) => authenticate(credentials, authApi.register),
      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          setAccessToken(null)
          writeStoredEmail(null)
          setEmail(null)
        }
      },
    }),
    [email, authenticate],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
