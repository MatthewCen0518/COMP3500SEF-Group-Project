import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

// The request layer reads the persisted session and redirects on expiry, so
// provide a minimal browser-like environment before importing it.
const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} })
const fakeLocation = { href: '/orders' }
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: globalThis.localStorage, location: fakeLocation },
  configurable: true,
})

const { request, ApiError } = await import('../src/lib/request')
const { useAuthStore } = await import('../src/stores/auth')
const { formatDateTime } = await import('../src/lib/order-meta')
const nativeFetch = globalThis.fetch

function respond(status: number, body = ''): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => body,
  } as Response
}

function stubFetch(handler: () => Response | Promise<Response>) {
  globalThis.fetch = (async () => handler()) as typeof fetch
}

afterEach(() => {
  globalThis.fetch = nativeFetch
  useAuthStore.getState().logout()
  fakeLocation.href = '/orders'
})

describe('request layer', () => {
  it('returns the parsed payload for a successful JSON response', async () => {
    stubFetch(() => respond(200, '{"id":1,"status":"pending"}'))
    const result = await request<{ id: number; status: string }>('/shipments/1')
    assert.deepEqual(result, { id: 1, status: 'pending' })
  })

  it('signs out and redirects when a protected endpoint returns a non-JSON 401', async () => {
    useAuthStore.getState().setAuth('stale-token', { id: 4, username: 'demo', role: 'admin' })
    stubFetch(() => respond(401, '<html>Proxy authentication required</html>'))
    await assert.rejects(request('/items'), (error: unknown) =>
      error instanceof ApiError && error.code === 401 && error.message === 'Session expired. Please sign in again')
    assert.equal(useAuthStore.getState().token, null)
    assert.equal(useAuthStore.getState().user, null)
    assert.equal(fakeLocation.href, '/login')
  })

  it('keeps the backend error message for a rejected sign-in', async () => {
    useAuthStore.getState().setAuth('stale-token', { id: 4, username: 'demo', role: 'admin' })
    stubFetch(() => respond(401, '{"error":"invalid credentials"}'))
    await assert.rejects(request('/auth/login', { method: 'POST' }), (error: unknown) =>
      error instanceof ApiError && error.code === 401 && error.message === 'invalid credentials')
    assert.equal(useAuthStore.getState().token, 'stale-token')
    assert.equal(fakeLocation.href, '/orders')
  })

  it('keeps a newer session when a request made with the old token returns 401', async () => {
    const user = { id: 4, username: 'demo', role: 'admin' }
    useAuthStore.getState().setAuth('old-token', user)
    stubFetch(() => {
      useAuthStore.getState().setAuth('new-token', user)
      return respond(401)
    })
    await assert.rejects(request('/items'), (error: unknown) => error instanceof ApiError && error.code === 401)
    assert.equal(useAuthStore.getState().token, 'new-token')
    assert.equal(fakeLocation.href, '/orders')
  })

  it('reports an HTTP error instead of throwing a JSON parse error on a bad gateway', async () => {
    stubFetch(() => respond(502, '<html>Bad Gateway</html>'))
    await assert.rejects(request('/items'), (error: unknown) =>
      error instanceof ApiError && error.code === 502 && error.message === 'Request failed (HTTP 502)')
  })

  it('rejects a successful data response with a missing or malformed JSON payload', async () => {
    for (const body of ['', '<html>Maintenance</html>', 'null']) {
      stubFetch(() => respond(200, body))
      await assert.rejects(request('/items'), (error: unknown) =>
        error instanceof ApiError && error.code === 200 && error.message.includes('JSON'))
    }
  })

  it('reports a missing payload when a catalogue request returns no content', async () => {
    for (const status of [204, 205]) {
      stubFetch(() => respond(status))
      await assert.rejects(request('/items'), (error: unknown) =>
        error instanceof ApiError && error.code === status && error.message.includes('JSON'))
    }
  })

  it('maps a network failure to a connection error', async () => {
    stubFetch(() => { throw new TypeError('fetch failed') })
    await assert.rejects(request('/items'), (error: unknown) =>
      error instanceof ApiError && error.code === -1 && error.message === 'Network error. Check your connection')
  })
})

describe('timestamp formatting', () => {
  it('displays UTC timestamps correctly in a non-UTC timezone', (t) => {
    const previousZone = process.env.TZ
    process.env.TZ = 'Asia/Hong_Kong'
    t.after(() => {
      if (previousZone === undefined) delete process.env.TZ
      else process.env.TZ = previousZone
    })
    const expected = new Date('2026-10-26T09:30:00Z').toLocaleString('en-GB')
    assert.equal(formatDateTime('2026-10-26 09:30:00'), expected)
    assert.equal(formatDateTime('2026-10-26T09:30:00'), expected)
  })

  it('respects an explicit timezone offset', () => {
    assert.equal(
      formatDateTime('2026-10-26T09:30:00+08:00'),
      formatDateTime('2026-10-26T01:30:00Z'),
    )
  })
})
