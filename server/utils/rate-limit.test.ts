import { afterEach, describe, expect, it } from 'vitest'
import { clearRateLimitBuckets, consumeRateLimit } from './rate-limit'

describe('consumeRateLimit', () => {
  afterEach(() => {
    clearRateLimitBuckets()
  })

  it('allows requests under the limit', () => {
    expect(consumeRateLimit('t1', { limit: 3, windowMs: 60_000 })).toBe(true)
    expect(consumeRateLimit('t1', { limit: 3, windowMs: 60_000 })).toBe(true)
    expect(consumeRateLimit('t1', { limit: 3, windowMs: 60_000 })).toBe(true)
  })

  it('blocks when over the limit', () => {
    expect(consumeRateLimit('t2', { limit: 2, windowMs: 60_000 })).toBe(true)
    expect(consumeRateLimit('t2', { limit: 2, windowMs: 60_000 })).toBe(true)
    expect(consumeRateLimit('t2', { limit: 2, windowMs: 60_000 })).toBe(false)
  })
})
