export const DEFAULT_PLATFORM_DOMAIN = 'sandiwa.localhost'
export const TENANT_PATH_PREFIX = '/o'

export type TenantRoutingMode = 'subdomain' | 'path'
export type TenantRoutingConfig = 'auto' | TenantRoutingMode

const DEV_PLATFORM_HOSTS = new Set(['localhost', '127.0.0.1'])

export function getEffectivePlatformDomain(
  configuredDomain = DEFAULT_PLATFORM_DOMAIN,
  hostname?: string
): string {
  const configured = configuredDomain.toLowerCase()

  if (configured !== DEFAULT_PLATFORM_DOMAIN) {
    return configured
  }

  const host = (hostname ?? (import.meta.client ? window.location.hostname : '')).toLowerCase()
  if (!host || host === DEFAULT_PLATFORM_DOMAIN || DEV_PLATFORM_HOSTS.has(host)) {
    return DEFAULT_PLATFORM_DOMAIN
  }

  if (host.endsWith('.localhost')) {
    return DEFAULT_PLATFORM_DOMAIN
  }

  const parts = host.split('.')
  if (host.endsWith('.vercel.app')) {
    if (parts.length >= 4) {
      return parts.slice(1).join('.')
    }
    return host
  }

  if (parts.length >= 3) {
    return parts.slice(1).join('.')
  }

  return host
}

export function inferTenantRoutingMode(
  hostname: string,
  platformDomain: string
): TenantRoutingMode {
  const host = hostname.toLowerCase()
  const domain = platformDomain.toLowerCase()

  if (domain.endsWith('.vercel.app') || host.endsWith('.vercel.app')) {
    return 'path'
  }

  return 'subdomain'
}

export function resolveTenantRoutingMode(
  hostname: string,
  platformDomain: string,
  configured: TenantRoutingConfig = 'auto'
): TenantRoutingMode {
  if (configured === 'subdomain' || configured === 'path') {
    return configured
  }

  return inferTenantRoutingMode(hostname, platformDomain)
}

/** @deprecated Use resolveTenantRoutingMode or inferTenantRoutingMode */
export function getTenantRoutingMode(
  hostname: string,
  platformDomain: string
): TenantRoutingMode {
  return inferTenantRoutingMode(hostname, platformDomain)
}

export function parseTenantRoutingConfig(value?: string): TenantRoutingConfig {
  if (value === 'subdomain' || value === 'path' || value === 'auto') {
    return value
  }
  return 'auto'
}

export function isPlatformHost(hostname: string, platformDomain = DEFAULT_PLATFORM_DOMAIN): boolean {
  const host = hostname.toLowerCase()
  const domain = platformDomain.toLowerCase()
  return host === domain || DEV_PLATFORM_HOSTS.has(host)
}

export function stripTenantPathPrefix(path: string): { slug: string | null, innerPath: string } {
  const match = path.match(/^\/o\/([^/]+)(\/.*)?$/)
  if (!match) {
    return { slug: null, innerPath: path }
  }

  return {
    slug: match[1] ?? null,
    innerPath: match[2] || '/'
  }
}

export function extractTenantSlugFromPath(pathname: string): string | null {
  return stripTenantPathPrefix(pathname).slug
}

export function tenantPath(
  path: string,
  slug: string | null,
  routingMode: TenantRoutingMode
): string {
  const normalized = path.startsWith('/') ? path : `/${path}`

  if (routingMode === 'path' && slug) {
    if (normalized === '/') {
      return `${TENANT_PATH_PREFIX}/${slug}`
    }
    return `${TENANT_PATH_PREFIX}/${slug}${normalized}`
  }

  return normalized
}

export function extractTenantSlug(
  hostname: string,
  platformDomain = DEFAULT_PLATFORM_DOMAIN
): string | null {
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

export function formatTenantHost(
  slug: string,
  platformDomain = DEFAULT_PLATFORM_DOMAIN,
  routingMode: TenantRoutingMode = 'subdomain'
): string {
  const domain = platformDomain.toLowerCase()

  if (routingMode === 'path') {
    return `${domain}${TENANT_PATH_PREFIX}/${slug}`
  }

  return `${slug}.${domain}`
}

export function buildTenantUrl(
  slug: string,
  platformDomain = DEFAULT_PLATFORM_DOMAIN,
  routingMode: TenantRoutingMode = 'subdomain'
): string {
  if (routingMode === 'path') {
    const origin = resolveOrigin(platformDomain)
    return `${origin}${TENANT_PATH_PREFIX}/${slug}/`
  }

  const host = formatTenantHost(slug, platformDomain, 'subdomain')
  return `${resolveOrigin(platformDomain, host)}/`
}

export function buildPlatformUrl(platformDomain = DEFAULT_PLATFORM_DOMAIN): string {
  return `${resolveOrigin(platformDomain)}/`
}

function resolveOrigin(platformDomain: string, host = platformDomain.toLowerCase()): string {
  if (import.meta.client) {
    const port = window.location.port ? `:${window.location.port}` : ''
    return `${window.location.protocol}//${host}${port}`
  }

  const isLocal = platformDomain.toLowerCase().endsWith('.localhost')
  const port = isLocal ? ':3000' : ''
  const protocol = isLocal ? 'http:' : 'https:'
  return `${protocol}//${host}${port}`
}

export function useTenantDomain() {
  const config = useRuntimeConfig()

  const platformDomain = computed(() => {
    const configured = (config.public.platformDomain as string) || DEFAULT_PLATFORM_DOMAIN
    if (import.meta.client) {
      return getEffectivePlatformDomain(configured, window.location.hostname)
    }
    return configured
  })

  const routingMode = computed<TenantRoutingMode>(() => {
    if (!import.meta.client) {
      return 'subdomain'
    }
    const configured = parseTenantRoutingConfig(config.public.tenantRouting as string | undefined)
    return resolveTenantRoutingMode(
      window.location.hostname,
      platformDomain.value,
      configured
    )
  })

  return {
    platformDomain,
    routingMode,
    formatTenantHost: (slug: string) => formatTenantHost(slug, platformDomain.value, routingMode.value),
    buildTenantUrl: (slug: string) => buildTenantUrl(slug, platformDomain.value, routingMode.value),
    buildPlatformUrl: () => buildPlatformUrl(platformDomain.value)
  }
}

export function useTenantPath() {
  const tenant = useTenantStore()
  const { routingMode } = useTenantDomain()

  function to(path: string) {
    return tenantPath(path, tenant.slug, routingMode.value)
  }

  return { to, tenantPath: to }
}
