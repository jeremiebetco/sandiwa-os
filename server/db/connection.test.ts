import { afterEach, describe, expect, it } from 'vitest'
import { getDatabaseUrl } from '../db/connection'

describe('getDatabaseUrl', () => {
  const prev = { ...process.env }

  afterEach(() => {
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.VERCEL = prev.VERCEL
    process.env.DATABASE_URL = prev.DATABASE_URL
    process.env.DATABASE_URL_ADMIN = prev.DATABASE_URL_ADMIN
  })

  it('falls back to local URL outside production', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.VERCEL
    delete process.env.DATABASE_URL
    expect(getDatabaseUrl('app')).toContain('localhost:5433')
  })

  it('fails closed in production without DATABASE_URL', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.VERCEL
    delete process.env.DATABASE_URL
    expect(() => getDatabaseUrl('app')).toThrow(/DATABASE_URL/)
  })
})
