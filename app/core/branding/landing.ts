import type { LandingContent } from '~/core/types'
import {
  type BrandId,
  BRANDS,
  parseAccentColor,
  resolveBrandId
} from './registry'

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

export function landingFromRecord(raw: unknown, slug?: string | null): LandingContent {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const brandId: BrandId = resolveBrandId({
    slug,
    brandId: readString(source, 'brandId') || null
  })
  const accent
    = parseAccentColor(source.accentColor)
      ?? BRANDS[brandId].fallbackAccent

  return {
    heroTitle: readString(source, 'heroTitle'),
    heroSubtitle: readString(source, 'heroSubtitle'),
    welcomeMessage: readString(source, 'welcomeMessage'),
    contactAddress: readString(source, 'contactAddress'),
    contactPhone: readString(source, 'contactPhone'),
    contactEmail: readString(source, 'contactEmail'),
    officeHours: readString(source, 'officeHours'),
    accentColor: accent,
    brandId
  }
}

export function defaultLandingFor(
  name: string,
  extras: Partial<LandingContent> = {},
  slug?: string | null
): LandingContent {
  return landingFromRecord({
    heroTitle: name,
    heroSubtitle: 'Community operations, in one place.',
    welcomeMessage: 'Pay dues, file requests, and follow community news.',
    officeHours: 'Mon-Fri 9:00 AM - 5:00 PM',
    ...extras
  }, slug)
}
