/**
 * CSRF origin checks for multi-tenant hosts.
 * Allows exact host match, *.localhost siblings, and subdomains of the configured platform domain.
 * Does NOT allow arbitrary *.vercel.app siblings (other projects share that parent).
 */

export function stripPort(host: string): string {
  // IPv6 [::1]:port
  if (host.startsWith('[')) {
    const end = host.indexOf(']')
    return end === -1 ? host.toLowerCase() : host.slice(0, end + 1).toLowerCase()
  }
  const idx = host.lastIndexOf(':')
  if (idx > 0 && /^\d+$/.test(host.slice(idx + 1))) {
    return host.slice(0, idx).toLowerCase()
  }
  return host.toLowerCase()
}

function isLocalhostFamily(host: string): boolean {
  const h = stripPort(host)
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.localhost')
}

function parentDomain(host: string): string {
  const h = stripPort(host)
  const parts = h.split('.')
  if (parts.length <= 2) return h
  return parts.slice(1).join('.')
}

/**
 * Returns true when Origin host is allowed to mutate against requestHost.
 * @param platformDomain optional NUXT_PUBLIC_PLATFORM_DOMAIN (e.g. sandiwa.localhost, sandiwa.os, app.vercel.app)
 */
export function isAllowedCsrfOrigin(
  originHost: string,
  requestHost: string,
  platformDomain?: string
): boolean {
  const origin = stripPort(originHost)
  const request = stripPort(requestHost)

  if (origin === request) return true

  // Local multi-tenant: greenfield-hoa.sandiwa.localhost ↔ sandiwa.localhost
  if (isLocalhostFamily(origin) && isLocalhostFamily(request)) {
    return true
  }

  const configured = platformDomain ? stripPort(platformDomain) : ''

  // Shared apex (custom domain or exact vercel.app project host)
  if (configured) {
    const underConfigured = (host: string) =>
      host === configured || host.endsWith(`.${configured}`)

    if (underConfigured(origin) && underConfigured(request)) {
      return true
    }
  }

  // Same registrable parent only when NOT a shared public suffix like vercel.app
  const originParent = parentDomain(origin)
  const requestParent = parentDomain(request)
  if (
    originParent === requestParent
    && originParent.includes('.')
    && !originParent.endsWith('vercel.app')
    && !originParent.endsWith('netlify.app')
  ) {
    return true
  }

  return false
}
