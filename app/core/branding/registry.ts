/**
 * Brand packs are CSS files under app/assets/css/brands/.
 * Switching a tenant's look is: add a CSS pack, register it here, set landing.brandId.
 * Named packs own color. The `tenant` pack is the fallback and may use accentColor.
 */

export const BRAND_IDS = ['sandiwa', 'greenfield', 'sunrise', 'tenant'] as const

export type BrandId = typeof BRAND_IDS[number]

export interface BrandMeta {
  id: BrandId
  label: string
  summary: string
  /** Used only when the pack is `tenant` and no valid accent is stored. */
  fallbackAccent: string
}

export const BRANDS: Record<BrandId, BrandMeta> = {
  sandiwa: {
    id: 'sandiwa',
    label: 'Sandiwa',
    summary: 'Platform identity. Indigo stamp on cool paper.',
    fallbackAccent: '#1f3d5c'
  },
  greenfield: {
    id: 'greenfield',
    label: 'Greenfield',
    summary: 'Garden subdivision. Canopy green, clubhouse light.',
    fallbackAccent: '#1f6b3a'
  },
  sunrise: {
    id: 'sunrise',
    label: 'Sunrise',
    summary: 'Tower lobby. Bronze hardware on honed stone.',
    fallbackAccent: '#8b5429'
  },
  tenant: {
    id: 'tenant',
    label: 'Tenant default',
    summary: 'Generic community pack. Accent comes from accentColor.',
    fallbackAccent: '#1f6b3a'
  }
}

export const BRAND_OPTIONS = BRAND_IDS.map(id => BRANDS[id])

const SLUG_DEFAULTS: Record<string, BrandId> = {
  'greenfield-hoa': 'greenfield',
  'sunrise-condo': 'sunrise'
}

const ACCENT_RE = /^#[0-9a-fA-F]{6}$/

export function isBrandId(value: unknown): value is BrandId {
  return typeof value === 'string' && (BRAND_IDS as readonly string[]).includes(value)
}

export function parseBrandId(value: unknown): BrandId | null {
  if (typeof value !== 'string') return null
  const id = value.trim().toLowerCase()
  return isBrandId(id) ? id : null
}

export function parseAccentColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const hex = value.trim()
  return ACCENT_RE.test(hex) ? hex.toLowerCase() : null
}

export function resolveBrandId(input: {
  isPlatform?: boolean
  slug?: string | null
  brandId?: string | null
}): BrandId {
  if (input.isPlatform) return 'sandiwa'
  const explicit = parseBrandId(input.brandId)
  if (explicit) return explicit
  const slugDefault = input.slug ? SLUG_DEFAULTS[input.slug] : undefined
  if (slugDefault) return slugDefault
  return 'tenant'
}

export function accentOverrideFor(brandId: BrandId, accentColor?: string | null): string | null {
  if (brandId !== 'tenant') return null
  return parseAccentColor(accentColor)
}
