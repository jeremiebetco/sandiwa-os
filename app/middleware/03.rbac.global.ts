import { useAuthStore } from '~/stores/auth'
import { useTenantStore } from '~/stores/tenant'
import { useFeatures } from '~/core/tenant/useFeatures'
import { canAccessModule } from '~/core/rbac/permissions'
import { stripTenantPathPrefix, tenantPath } from '~/core/tenant/domain'
import type { OrgRole, PluginKey } from '~/core/types'

const MODULE_ROUTE_MAP: Record<string, PluginKey> = {
  '/console/modules/intake': 'intake',
  '/console/modules/payments': 'payments',
  '/console/modules/ledger': 'ledger',
  '/console/modules/polls': 'polls',
  '/console/modules/broadcasts': 'broadcasts',
  '/console/landing': 'landing_editor',
  '/console/staff': 'staff_management',
  '/console/announcements': 'announcements',
  '/portal/requests': 'intake'
}

export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return

  const auth = useAuthStore()
  const tenant = useTenantStore()
  const { isEnabled } = useFeatures()

  const { innerPath } = stripTenantPathPrefix(to.path)
  const orgPath = tenant.isOrganization ? innerPath : to.path

  function orgTo(path: string) {
    return tenantPath(path, tenant.slug, tenant.routingMode)
  }

  const matchedEntry = Object.entries(MODULE_ROUTE_MAP).find(([prefix]) =>
    orgPath === prefix || orgPath.startsWith(prefix + '/')
  )

  if (!matchedEntry) return

  const [routePrefix, plugin] = matchedEntry

  if (!isEnabled(plugin)) {
    if (orgPath.startsWith('/console')) {
      return navigateTo(orgTo('/console/module-disabled'))
    }
    return navigateTo(orgTo('/'))
  }

  if (tenant.isOrganization && orgPath.startsWith('/console')) {
    if (!auth.isOrgStaff || !auth.user) {
      return navigateTo(orgTo('/login'))
    }
    if (!canAccessModule(auth.user.role as OrgRole, plugin)) {
      return navigateTo(orgTo('/console'))
    }
  }

  if (orgPath.startsWith(routePrefix) && tenant.isOrganization && orgPath.startsWith('/portal')) {
    // portal intake accessible to members when enabled — no staff role required
  }
})
