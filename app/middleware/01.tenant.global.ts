import { useTenantStore } from '~/stores/tenant'
import { useAuthStore } from '~/stores/auth'
import { usePlatformStore } from '~/stores/platform'
import { stripTenantPathPrefix, tenantPath } from '~/core/tenant/domain'

export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return

  const tenant = useTenantStore()
  const auth = useAuthStore()
  const platform = usePlatformStore()

  tenant.initialize()
  platform.hydrate()
  auth.validateSessionForContext()

  if (tenant.isOrganization && tenant.unknownOrg) {
    const { innerPath } = stripTenantPathPrefix(to.path)
    if (innerPath !== '/not-found') {
      return navigateTo(tenantPath('/not-found', tenant.slug, tenant.routingMode))
    }
  }
})
