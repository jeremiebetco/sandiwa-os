import { describe, expect, it } from 'vitest'
import { defaultLandingFor, landingFromRecord } from './landing'
import {
  accentOverrideFor,
  isBrandId,
  parseAccentColor,
  parseBrandId,
  resolveBrandId
} from './registry'

describe('brand registry', () => {
  it('accepts only registered pack ids', () => {
    expect(isBrandId('greenfield')).toBe(true)
    expect(isBrandId('navy-teal')).toBe(false)
    expect(parseBrandId(' Sunrise ')).toBe('sunrise')
    expect(parseBrandId('nope')).toBeNull()
  })

  it('accepts 6-digit hex accents only', () => {
    expect(parseAccentColor('#1F6B3A')).toBe('#1f6b3a')
    expect(parseAccentColor('#fff')).toBeNull()
    expect(parseAccentColor('red')).toBeNull()
    expect(parseAccentColor('javascript:alert(1)')).toBeNull()
  })

  it('resolves platform to sandiwa and honors stored brandId over slug defaults', () => {
    expect(resolveBrandId({ isPlatform: true, slug: 'greenfield-hoa' })).toBe('sandiwa')
    expect(resolveBrandId({ slug: 'greenfield-hoa' })).toBe('greenfield')
    expect(resolveBrandId({ slug: 'greenfield-hoa', brandId: 'sunrise' })).toBe('sunrise')
    expect(resolveBrandId({ slug: 'new-hoa' })).toBe('tenant')
  })

  it('allows accent override only on the tenant fallback pack', () => {
    expect(accentOverrideFor('tenant', '#8b5429')).toBe('#8b5429')
    expect(accentOverrideFor('greenfield', '#8b5429')).toBeNull()
  })
})

describe('landing normalization', () => {
  it('fills brandId from slug when the stored payload omits it', () => {
    const landing = landingFromRecord({
      heroTitle: 'Hello',
      accentColor: '#0f766e'
    }, 'sunrise-condo')
    expect(landing.brandId).toBe('sunrise')
    expect(landing.accentColor).toBe('#0f766e')
  })

  it('rejects an unknown brandId and falls back through slug then tenant', () => {
    const landing = landingFromRecord({ brandId: 'hacked', accentColor: 'nope' }, 'unknown-hoa')
    expect(landing.brandId).toBe('tenant')
    expect(landing.accentColor).toBe('#1f6b3a')
  })

  it('builds a complete default landing for a new org', () => {
    const landing = defaultLandingFor('Riverbank HOA', { brandId: 'tenant' }, 'riverbank-hoa')
    expect(landing.heroTitle).toBe('Riverbank HOA')
    expect(landing.brandId).toBe('tenant')
    expect(landing.officeHours.includes('–')).toBe(false)
  })
})
