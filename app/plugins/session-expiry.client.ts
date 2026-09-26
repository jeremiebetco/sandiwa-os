import { isCredentialFailure, sessionExpiryPath } from '~/core/auth/session-expiry'

function requestUrl(request: RequestInfo): string {
  if (typeof request === 'string') return request
  if (request instanceof URL) return request.href
  return request.url
}

export default defineNuxtPlugin(() => {
  const original = globalThis.$fetch
  globalThis.$fetch = original.create({
    async onResponseError({ request, response }) {
      if (response.status !== 401) return
      if (isCredentialFailure(requestUrl(request))) return

      const auth = useAuthStore()
      const tenant = useTenantStore()
      auth.clearSession()

      const target = sessionExpiryPath({
        isPlatform: tenant.isPlatform,
        slug: tenant.slug,
        routingMode: tenant.routingMode
      })
      if (window.location.pathname !== target) {
        await navigateTo(target)
      }
    }
  })
})
