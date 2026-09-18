import type { ApiError } from '../types/error'

const ACCESS_TOKEN_KEY = 'tm-token'
const AUTH_PREFIX = '/api/auth/'
const REFRESH_URL = '/api/auth/refresh'

export class HttpError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  } catch {
    // private browsing: the session simply does not survive a reload
  }
}

/** Called when refreshing fails, so the app can clear its own state and route to /login. */
let onSessionExpired: () => void = () => {}

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler
}

/**
 * Concurrent 401s must share one refresh. Five parallel calls each rotating the cookie would
 * present an already-used token, which the backend correctly treats as theft and answers by
 * revoking the whole family.
 */
let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(REFRESH_URL, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        return false
      }
      const body = (await response.json()) as { token: string }
      setAccessToken(body.token)
      return true
    } catch {
      return false
    } finally {
      // cleared on the next tick so callers awaiting this promise all see the same result
      queueMicrotask(() => {
        refreshInFlight = null
      })
    }
  })()

  return refreshInFlight
}

async function toHttpError(response: Response): Promise<HttpError> {
  let message = response.statusText || 'request failed'
  let fieldErrors: Record<string, string> = {}
  try {
    const body = (await response.json()) as ApiError
    message = body.message ?? message
    fieldErrors = body.errors ?? {}
  } catch {
    // not every error carries the JSON envelope (a proxy 502, for instance)
  }
  return new HttpError(response.status, message, fieldErrors)
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) {
    return path
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }
  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

async function send(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include',
    signal: options.signal,
  })
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, getAccessToken())

  // guard 1: a 401 from an auth route is the answer, not an expired session — a wrong
  // password must surface as an inline error rather than a refresh attempt or a redirect
  if (response.status === 401 && !path.startsWith(AUTH_PREFIX)) {
    // guard 2: nothing to refresh if the user was never signed in
    if (getAccessToken() && (await refreshAccessToken())) {
      response = await send(path, options, getAccessToken())
    } else {
      setAccessToken(null)
      onSessionExpired()
      throw await toHttpError(response)
    }
  }

  if (!response.ok) {
    throw await toHttpError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
