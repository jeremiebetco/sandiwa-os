import { tenantPath, type TenantRoutingMode } from '~/core/tenant/domain'

/** Wrong-password responses must stay on the sign-in form. */
export function isCredentialFailure(url: string): boolean {
  const path = url.startsWith('http://') || url.startsWith('https://')
    ? new URL(url).pathname
    : (url.split('?')[0] ?? url)
  return path === '/api/auth/login' || path.endsWith('/api/auth/login')
}

/** Where to send the browser after the session cookie stops working. */
export function sessionExpiryPath(input: {
  isPlatform: boolean
  slug: string | null
  routingMode: TenantRoutingMode
}): string {
  if (input.isPlatform) return '/platform/login'
  return tenantPath('/login', input.slug, input.routingMode)
}
