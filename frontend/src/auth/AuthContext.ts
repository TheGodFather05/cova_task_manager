import { createContext } from 'react'
import type { Credentials } from '../types/auth'

export interface AuthContextValue {
  email: string | null
  isAuthenticated: boolean
  login: (credentials: Credentials) => Promise<void>
  register: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
