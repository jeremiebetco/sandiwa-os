import { afterEach, describe, expect, it } from 'vitest'
import { ORG_DEMO_PASSWORD, resolvePlatformAdminPassword } from './demo-passwords'

describe('resolvePlatformAdminPassword', () => {
  const prev = { ...process.env }

  afterEach(() => {
    process.env.PLATFORM_ADMIN_PASSWORD = prev.PLATFORM_ADMIN_PASSWORD
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.VERCEL = prev.VERCEL
  })

  it('defaults to org demo password locally when unset', () => {
    delete process.env.PLATFORM_ADMIN_PASSWORD
    delete process.env.VERCEL
    process.env.NODE_ENV = 'development'
    expect(resolvePlatformAdminPassword()).toBe(ORG_DEMO_PASSWORD)
  })

  it('uses PLATFORM_ADMIN_PASSWORD when set locally', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.VERCEL
    process.env.PLATFORM_ADMIN_PASSWORD = 'local-platform-pass'
    expect(resolvePlatformAdminPassword()).toBe('local-platform-pass')
  })

  it('rejects missing password when requireStrong', () => {
    delete process.env.PLATFORM_ADMIN_PASSWORD
    expect(() => resolvePlatformAdminPassword({ requireStrong: true })).toThrow(/PLATFORM_ADMIN_PASSWORD/)
  })

  it('rejects demo1234 when requireStrong', () => {
    process.env.PLATFORM_ADMIN_PASSWORD = 'demo1234-still-weak'
    expect(() => resolvePlatformAdminPassword({ requireStrong: true })).toThrow(/weak|demo/)
  })

  it('rejects short passwords when requireStrong', () => {
    process.env.PLATFORM_ADMIN_PASSWORD = 'demo1234'
    expect(() => resolvePlatformAdminPassword({ requireStrong: true })).toThrow(/≥12|12 characters/)
  })

  it('accepts a strong password when requireStrong', () => {
    process.env.PLATFORM_ADMIN_PASSWORD = 'portfolio-lock-9f3a2c'
    expect(resolvePlatformAdminPassword({ requireStrong: true })).toBe('portfolio-lock-9f3a2c')
  })
})
