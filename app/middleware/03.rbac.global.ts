import { useAuthStore } from '~/stores/auth'
import { useTenantStore } from '~/stores/tenant'
import { useFeatures } from '~/core/tenant/useFeatures'
import { canAccessModule } from '~/core/rbac/permissions'
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

  const matchedEntry = Object.entries(MODULE_ROUTE_MAP).find(([prefix]) =>
    to.path === prefix || to.path.startsWith(prefix + '/')
  )

  if (!matchedEntry) return

  const [routePrefix, plugin] = matchedEntry

  if (!isEnabled(plugin)) {
    if (to.path.startsWith('/console')) {
      return navigateTo('/console/module-disabled')
    }
    return navigateTo('/')
  }

  if (tenant.isOrganization && to.path.startsWith('/console')) {
    if (!auth.isOrgStaff || !auth.user) {
      return navigateTo('/login')
    }
    if (!canAccessModule(auth.user.role as OrgRole, plugin)) {
      return navigateTo('/console')
    }
  }

  if (to.path.startsWith(routePrefix) && tenant.isOrganization && to.path.startsWith('/portal')) {
    // portal intake accessible to members when enabled — no staff role required
  }
})
