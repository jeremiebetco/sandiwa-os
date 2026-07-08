import { useTenantStore } from '~/stores/tenant'
import { useAuthStore } from '~/stores/auth'
import { usePlatformStore } from '~/stores/platform'

export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return

  const tenant = useTenantStore()
  const auth = useAuthStore()
  const platform = usePlatformStore()

  tenant.initialize()
  platform.hydrate()
  auth.validateSessionForContext()

  if (tenant.isOrganization && tenant.unknownOrg) {
    return navigateTo('/not-found')
  }
})
