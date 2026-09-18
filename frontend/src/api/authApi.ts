import type { AuthResponse, Credentials } from '../types/auth'
import { api, setAccessToken } from './client'

export const authApi = {
  async register(credentials: Credentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', credentials)
    setAccessToken(response.token)
    return response
  },

  async login(credentials: Credentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials)
    setAccessToken(response.token)
    return response
  },

  /** Revokes the refresh family server-side; the cookie is cleared by the response. */
  async logout(): Promise<void> {
    try {
      await api.post<void>('/api/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },
}
