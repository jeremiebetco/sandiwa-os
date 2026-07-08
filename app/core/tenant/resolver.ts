import type { TenantContext } from '~/core/types'
import {
  DEFAULT_PLATFORM_DOMAIN,
  extractTenantSlug,
  extractTenantSlugFromPath,
  getEffectivePlatformDomain,
  resolveTenantRoutingMode,
  isPlatformHost,
  type TenantRoutingConfig,
  type TenantRoutingMode
} from './domain'

export interface TenantResolution {
  context: TenantContext
  slug: string | null
  hostname: string
  routingMode: TenantRoutingMode
}

export function resolveTenantFromHostname(
  hostname?: string,
  platformDomain = DEFAULT_PLATFORM_DOMAIN,
  pathname?: string,
  routingConfig: TenantRoutingConfig = 'auto'
): TenantResolution {
  const host = (
    hostname
    ?? (import.meta.client ? window.location.hostname : platformDomain)
  ).toLowerCase()

  const path = pathname ?? (import.meta.client ? window.location.pathname : '/')
  const domain = getEffectivePlatformDomain(platformDomain, host)
  const mode = resolveTenantRoutingMode(host, domain, routingConfig)

  if (mode === 'path' && isPlatformHost(host, domain)) {
    const slug = extractTenantSlugFromPath(path)
    if (slug) {
      return { context: 'organization', slug, hostname: host, routingMode: mode }
    }
    return { context: 'platform', slug: null, hostname: host, routingMode: mode }
  }

  if (isPlatformHost(host, domain)) {
    return { context: 'platform', slug: null, hostname: host, routingMode: mode }
  }

  const slug = extractTenantSlug(host, domain)
  if (slug) {
    return { context: 'organization', slug, hostname: host, routingMode: mode }
  }

  return { context: 'platform', slug: null, hostname: host, routingMode: mode }
}
