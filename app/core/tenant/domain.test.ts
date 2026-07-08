import { describe, expect, it } from 'vitest'
import {
  buildPlatformUrl,
  buildTenantUrl,
  extractTenantSlug,
  formatTenantHost,
  isPlatformHost
} from './domain'
import { resolveTenantFromHostname } from './resolver'

const LOCAL = 'sandiwa.localhost'
const VERCEL = 'sandiwa-os.vercel.app'

describe('isPlatformHost', () => {
  it('recognizes platform apex on local and Vercel', () => {
    expect(isPlatformHost('sandiwa.localhost', LOCAL)).toBe(true)
    expect(isPlatformHost('sandiwa-os.vercel.app', VERCEL)).toBe(true)
  })

  it('recognizes dev fallbacks', () => {
    expect(isPlatformHost('localhost', LOCAL)).toBe(true)
    expect(isPlatformHost('127.0.0.1', LOCAL)).toBe(true)
  })

  it('rejects tenant subdomains', () => {
    expect(isPlatformHost('greenfield-hoa.sandiwa.localhost', LOCAL)).toBe(false)
    expect(isPlatformHost('greenfield-hoa.sandiwa-os.vercel.app', VERCEL)).toBe(false)
  })
})

describe('extractTenantSlug', () => {
  it('extracts slug from local subdomains', () => {
    expect(extractTenantSlug('greenfield-hoa.sandiwa.localhost', LOCAL)).toBe('greenfield-hoa')
    expect(extractTenantSlug('sunrise-condo.sandiwa.localhost', LOCAL)).toBe('sunrise-condo')
  })

  it('extracts slug from Vercel subdomains', () => {
    expect(extractTenantSlug('greenfield-hoa.sandiwa-os.vercel.app', VERCEL)).toBe('greenfield-hoa')
  })

  it('supports bare slug.localhost fallback', () => {
    expect(extractTenantSlug('greenfield-hoa.localhost', LOCAL)).toBe('greenfield-hoa')
  })

  it('returns null for platform hosts', () => {
    expect(extractTenantSlug('sandiwa.localhost', LOCAL)).toBeNull()
    expect(extractTenantSlug('sandiwa-os.vercel.app', VERCEL)).toBeNull()
  })
})

describe('formatTenantHost', () => {
  it('formats tenant hostnames per environment', () => {
    expect(formatTenantHost('greenfield-hoa', LOCAL)).toBe('greenfield-hoa.sandiwa.localhost')
    expect(formatTenantHost('greenfield-hoa', VERCEL)).toBe('greenfield-hoa.sandiwa-os.vercel.app')
  })
})

describe('buildTenantUrl', () => {
  it('builds HTTPS URLs for Vercel without port', () => {
    expect(buildTenantUrl('greenfield-hoa', VERCEL)).toBe('https://greenfield-hoa.sandiwa-os.vercel.app/')
  })

  it('builds HTTP URLs for local with dev port', () => {
    expect(buildTenantUrl('greenfield-hoa', LOCAL)).toBe('http://greenfield-hoa.sandiwa.localhost:3000/')
  })
})

describe('buildPlatformUrl', () => {
  it('builds platform URLs per environment', () => {
    expect(buildPlatformUrl(VERCEL)).toBe('https://sandiwa-os.vercel.app/')
    expect(buildPlatformUrl(LOCAL)).toBe('http://sandiwa.localhost:3000/')
  })
})

describe('resolveTenantFromHostname', () => {
  it('resolves platform context on apex domains', () => {
    expect(resolveTenantFromHostname('sandiwa.localhost', LOCAL)).toEqual({
      context: 'platform',
      slug: null,
      hostname: 'sandiwa.localhost'
    })
    expect(resolveTenantFromHostname('sandiwa-os.vercel.app', VERCEL)).toEqual({
      context: 'platform',
      slug: null,
      hostname: 'sandiwa-os.vercel.app'
    })
  })

  it('resolves organization context from tenant subdomains', () => {
    expect(resolveTenantFromHostname('greenfield-hoa.sandiwa-os.vercel.app', VERCEL)).toEqual({
      context: 'organization',
      slug: 'greenfield-hoa',
      hostname: 'greenfield-hoa.sandiwa-os.vercel.app'
    })
  })

  it('falls back to platform for unknown hosts', () => {
    expect(resolveTenantFromHostname('unknown.example.com', VERCEL)).toEqual({
      context: 'platform',
      slug: null,
      hostname: 'unknown.example.com'
    })
  })
})
