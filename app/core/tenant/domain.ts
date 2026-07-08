export const DEFAULT_PLATFORM_DOMAIN = 'sandiwa.localhost'

const DEV_PLATFORM_HOSTS = new Set(['localhost', '127.0.0.1'])

export function isPlatformHost(hostname: string, platformDomain = DEFAULT_PLATFORM_DOMAIN): boolean {
  const host = hostname.toLowerCase()
  const domain = platformDomain.toLowerCase()
  return host === domain || DEV_PLATFORM_HOSTS.has(host)
}

export function extractTenantSlug(hostname: string, platformDomain = DEFAULT_PLATFORM_DOMAIN): string | null {
  const host = hostname.toLowerCase()
  const domain = platformDomain.toLowerCase()

  if (isPlatformHost(host, domain)) {
    return null
  }

  const suffix = `.${domain}`
  if (host.endsWith(suffix)) {
    const subdomain = host.slice(0, -suffix.length)
    const slug = subdomain.split('.').pop()
    if (slug && slug !== 'www') {
      return slug
    }
  }

  if (host.endsWith('.localhost')) {
    const parts = host.split('.')
    if (parts.length >= 2) {
      const slug = parts[0]
      if (slug && slug !== 'www') {
        return slug
      }
    }
  }

  return null
}

export function formatTenantHost(slug: string, platformDomain = DEFAULT_PLATFORM_DOMAIN): string {
  return `${slug}.${platformDomain.toLowerCase()}`
}

export function buildTenantUrl(slug: string, platformDomain = DEFAULT_PLATFORM_DOMAIN): string {
  const host = formatTenantHost(slug, platformDomain)

  if (import.meta.client) {
    const port = window.location.port ? `:${window.location.port}` : ''
    return `${window.location.protocol}//${host}${port}/`
  }

  return fallbackOriginUrl(host, platformDomain)
}

export function buildPlatformUrl(platformDomain = DEFAULT_PLATFORM_DOMAIN): string {
  const host = platformDomain.toLowerCase()

  if (import.meta.client) {
    const port = window.location.port ? `:${window.location.port}` : ''
    return `${window.location.protocol}//${host}${port}/`
  }

  return fallbackOriginUrl(host, platformDomain)
}

function fallbackOriginUrl(host: string, platformDomain: string): string {
  const isLocal = platformDomain.toLowerCase().endsWith('.localhost')
  const port = isLocal ? ':3000' : ''
  const protocol = isLocal ? 'http:' : 'https:'
  return `${protocol}//${host}${port}/`
}

export function useTenantDomain() {
  const config = useRuntimeConfig()
  const platformDomain = computed(
    () => (config.public.platformDomain as string) || DEFAULT_PLATFORM_DOMAIN
  )

  return {
    platformDomain,
    formatTenantHost: (slug: string) => formatTenantHost(slug, platformDomain.value),
    buildTenantUrl: (slug: string) => buildTenantUrl(slug, platformDomain.value),
    buildPlatformUrl: () => buildPlatformUrl(platformDomain.value)
  }
}
