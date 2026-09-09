import { afterEach, describe, expect, it } from 'vitest'
import { getSessionSecret } from './session-secret'

describe('getSessionSecret', () => {
  const prev = { ...process.env }

  afterEach(() => {
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.SESSION_SECRET = prev.SESSION_SECRET
    process.env.VERCEL = prev.VERCEL
  })

  it('uses SESSION_SECRET in development when long enough', () => {
    process.env.NODE_ENV = 'development'
    process.env.VERCEL = undefined
    process.env.SESSION_SECRET = 'local-dev-session-secret-min-32-chars'
    expect(getSessionSecret()).toBe('local-dev-session-secret-min-32-chars')
  })

  it('rejects short secrets in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.VERCEL = undefined
    process.env.SESSION_SECRET = 'too-short'
    expect(() => getSessionSecret()).toThrow(/SESSION_SECRET/)
  })

  it('rejects placeholder secrets in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.SESSION_SECRET = 'change-me-to-a-long-random-string-please'
    expect(() => getSessionSecret()).toThrow(/placeholder/)
  })
})
