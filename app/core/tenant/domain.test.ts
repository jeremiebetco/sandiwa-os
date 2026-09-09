import { describe, expect, it } from 'vitest'
import {
  buildPlatformUrl,
  buildTenantUrl,
  extractTenantSlug,
  extractTenantSlugFromPath,
  formatTenantHost,
  getEffectivePlatformDomain,
  inferTenantRoutingMode,
  parseTenantRoutingConfig,
  resolveTenantRoutingMode,
  isPlatformHost,
  stripTenantPathPrefix,
  tenantPath
} from './domain'
import { resolveTenantFromHostname } from './resolver'

const LOCAL = 'sandiwa.localhost'
const VERCEL = 'sandiwa-os.vercel.app'

describe('inferTenantRoutingMode', () => {
  it('uses path mode on vercel.app', () => {
    expect(inferTenantRoutingMode('sandiwa-os.vercel.app', VERCEL)).toBe('path')
  })

  it('uses subdomain mode on localhost', () => {
    expect(inferTenantRoutingMode('sandiwa.localhost', LOCAL)).toBe('subdomain')
  })
})

describe('resolveTenantRoutingMode', () => {
  it('honours explicit path override on localhost', () => {
    expect(resolveTenantRoutingMode('sandiwa.localhost', LOCAL, 'path')).toBe('path')
  })

  it('honours explicit subdomain override on vercel', () => {
    expect(resolveTenantRoutingMode('sandiwa-os.vercel.app', VERCEL, 'subdomain')).toBe('subdomain')
  })

  it('auto-detects when configured as auto', () => {
    expect(resolveTenantRoutingMode('sandiwa-os.vercel.app', VERCEL, 'auto')).toBe('path')
    expect(resolveTenantRoutingMode('sandiwa.localhost', LOCAL, 'auto')).toBe('subdomain')
  })
})

describe('parseTenantRoutingConfig', () => {
  it('accepts valid values and defaults invalid input to auto', () => {
    expect(parseTenantRoutingConfig('path')).toBe('path')
    expect(parseTenantRoutingConfig('subdomain')).toBe('subdomain')
    expect(parseTenantRoutingConfig('auto')).toBe('auto')
    expect(parseTenantRoutingConfig('invalid')).toBe('auto')
    expect(parseTenantRoutingConfig(undefined)).toBe('auto')
  })
})

describe('getEffectivePlatformDomain', () => {
  it('detects vercel apex when config is default localhost', () => {
    expect(getEffectivePlatformDomain('sandiwa.localhost', 'sandiwa-os.vercel.app')).toBe('sandiwa-os.vercel.app')
  })

  it('keeps localhost when browsing locally', () => {
    expect(getEffectivePlatformDomain('sandiwa.localhost', 'sandiwa.localhost')).toBe('sandiwa.localhost')
  })
})

describe('path prefix helpers', () => {
  it('extracts slug from /o/:slug paths', () => {
    expect(extractTenantSlugFromPath('/o/greenfield-hoa')).toBe('greenfield-hoa')
    expect(extractTenantSlugFromPath('/o/greenfield-hoa/console')).toBe('greenfield-hoa')
  })

  it('strips tenant path prefix', () => {
    expect(stripTenantPathPrefix('/o/greenfield-hoa/console')).toEqual({
      slug: 'greenfield-hoa',
      innerPath: '/console'
    })
    expect(stripTenantPathPrefix('/platform/orgs')).toEqual({
      slug: null,
      innerPath: '/platform/orgs'
    })
  })

  it('builds tenant paths in path mode', () => {
    expect(tenantPath('/console', 'greenfield-hoa', 'path')).toBe('/o/greenfield-hoa/console')
    expect(tenantPath('/console', 'greenfield-hoa', 'subdomain')).toBe('/console')
  })
})

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
  })
})

describe('extractTenantSlug', () => {
  it('extracts slug from local subdomains', () => {
    expect(extractTenantSlug('greenfield-hoa.sandiwa.localhost', LOCAL)).toBe('greenfield-hoa')
    expect(extractTenantSlug('sunrise-condo.sandiwa.localhost', LOCAL)).toBe('sunrise-condo')
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
  it('formats subdomain hostnames locally', () => {
    expect(formatTenantHost('greenfield-hoa', LOCAL, 'subdomain')).toBe('greenfield-hoa.sandiwa.localhost')
  })

  it('formats path-based hostnames on Vercel', () => {
    expect(formatTenantHost('greenfield-hoa', VERCEL, 'path')).toBe('sandiwa-os.vercel.app/o/greenfield-hoa')
  })
})

describe('buildTenantUrl', () => {
  it('builds path URLs for Vercel', () => {
    expect(buildTenantUrl('greenfield-hoa', VERCEL, 'path')).toBe('https://sandiwa-os.vercel.app/o/greenfield-hoa/')
  })

  it('builds subdomain URLs locally', () => {
    expect(buildTenantUrl('greenfield-hoa', LOCAL, 'subdomain')).toBe('http://greenfield-hoa.sandiwa.localhost:3000/')
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
    expect(resolveTenantFromHostname('sandiwa.localhost', LOCAL)).toMatchObject({
      context: 'platform',
      slug: null,
      routingMode: 'subdomain'
    })
    expect(resolveTenantFromHostname('sandiwa-os.vercel.app', VERCEL)).toMatchObject({
      context: 'platform',
      slug: null,
      routingMode: 'path'
    })
  })

  it('resolves organization context from path on Vercel', () => {
    expect(resolveTenantFromHostname('sandiwa-os.vercel.app', VERCEL, '/o/greenfield-hoa/')).toMatchObject({
      context: 'organization',
      slug: 'greenfield-hoa',
      routingMode: 'path'
    })
  })

  it('resolves organization context from tenant subdomains locally', () => {
    expect(resolveTenantFromHostname('greenfield-hoa.sandiwa.localhost', LOCAL)).toMatchObject({
      context: 'organization',
      slug: 'greenfield-hoa',
      routingMode: 'subdomain'
    })
  })
})
