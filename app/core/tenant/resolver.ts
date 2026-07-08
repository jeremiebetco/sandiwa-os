import type { TenantContext } from '~/core/types'

export interface TenantResolution {
  context: TenantContext
  slug: string | null
  hostname: string
}

const PLATFORM_HOSTS = new Set(['sandiwa.localhost', 'localhost', '127.0.0.1'])

export function resolveTenantFromHostname(hostname?: string): TenantResolution {
  const host = (hostname ?? (import.meta.client ? window.location.hostname : 'sandiwa.localhost')).toLowerCase()

  if (PLATFORM_HOSTS.has(host)) {
    return { context: 'platform', slug: null, hostname: host }
  }

  const parts = host.split('.')
  if (parts.length >= 3 && parts.slice(-2).join('.') === 'sandiwa.localhost') {
    const slug = parts[0]
    if (slug && slug !== 'www') {
      return { context: 'organization', slug, hostname: host }
    }
  }

  if (host.endsWith('.localhost') && parts.length >= 2) {
    const slug = parts[0]
    if (slug && slug !== 'www') {
      return { context: 'organization', slug, hostname: host }
    }
  }

  return { context: 'platform', slug: null, hostname: host }
}
