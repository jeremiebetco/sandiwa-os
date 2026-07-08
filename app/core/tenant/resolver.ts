import type { TenantContext } from '~/core/types'
import { DEFAULT_PLATFORM_DOMAIN, extractTenantSlug, isPlatformHost } from './domain'

export interface TenantResolution {
  context: TenantContext
  slug: string | null
  hostname: string
}

export function resolveTenantFromHostname(
  hostname?: string,
  platformDomain = DEFAULT_PLATFORM_DOMAIN
): TenantResolution {
  const host = (
    hostname
    ?? (import.meta.client ? window.location.hostname : platformDomain)
  ).toLowerCase()

  if (isPlatformHost(host, platformDomain)) {
    return { context: 'platform', slug: null, hostname: host }
  }

  const slug = extractTenantSlug(host, platformDomain)
  if (slug) {
    return { context: 'organization', slug, hostname: host }
  }

  return { context: 'platform', slug: null, hostname: host }
}
