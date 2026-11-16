/** Call the shared Python API and preserve its HTTP status and error message. */
import { useAuthStore } from '@/stores/auth'

export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  data?: unknown
  signal?: AbortSignal
}

const BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

function parseBody(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function errorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload
      && typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error
  }
  return `Request failed (HTTP ${status})`
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = useAuthStore.getState().token
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${url}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.data === undefined ? undefined : JSON.stringify(options.data),
      signal: options.signal,
    })
  } catch {
    throw new ApiError(-1, 'Network error. Check your connection')
  }

  // Handle an expired session before reading the body. A proxy or a failed
  // backend can answer with a non-JSON 401, which must not leave the user
  // signed in with a stale token.
  if (response.status === 401 && url !== '/auth/login') {
    const session = useAuthStore.getState()
    if (session.token === token) {
      session.logout()
      window.location.href = '/login'
    }
    throw new ApiError(401, 'Session expired. Please sign in again')
  }
  let text: string
  try {
    text = await response.text()
  } catch {
    throw new ApiError(response.status, `Request failed (HTTP ${response.status})`)
  }
  const payload = parseBody(text)

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(payload, response.status))
  }
  // The frontend API methods all require a JSON payload, including successful writes.
  if (payload === null) {
    throw new ApiError(response.status, `Expected a JSON payload (HTTP ${response.status})`)
  }
  return payload as T
}
